// Phase 3: parse the raw Robinhood statement CSVs and populate
// accounts / securities / transactions. Safe to re-run - it only
// deletes rows it previously inserted itself (matched by `source`),
// so it won't touch cron-generated transactions from later phases.

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const db = require('../db/connection');

const RAW_DIR = path.join(__dirname, '..', '..', 'data', 'raw', 'statements');

const STATEMENT_FILES = [
  { file: 'brokerage2025.csv', accountName: 'Robinhood Taxable', accountType: 'taxable' },
  { file: 'rothira.csv', accountName: 'Robinhood Roth IRA', accountType: 'roth' },
];

// Metadata Robinhood's CSV doesn't reliably give us (Description text
// is inconsistent - some rows have full names, some just the symbol).
// expense_ratio is the fund's real published annual ratio (as a
// percent, e.g. 0.09 = 0.09%/yr) - null for individual stocks/private
// holdings, which don't have one. Used by Phase 8's fee-drag analysis.
const SECURITY_META = {
  SPY: { name: 'SPDR S&P 500 ETF Trust', type: 'etf', expense_ratio: 0.09 },
  SCHD: { name: 'Schwab US Dividend Equity ETF', type: 'etf', expense_ratio: 0.06 },
  TQQQ: { name: 'ProShares UltraPro QQQ', type: 'etf', expense_ratio: 0.88 },
  AVUV: { name: 'Avantis U.S. Small Cap Value ETF', type: 'etf', expense_ratio: 0.25 },
  VXUS: { name: 'Vanguard Total International Stock ETF', type: 'etf', expense_ratio: 0.07 },
  VTI: { name: 'Vanguard Total Stock Market ETF', type: 'etf', expense_ratio: 0.03 },
  NVDA: { name: 'NVIDIA Corp', type: 'stock' },
  IBM: { name: 'IBM Corp', type: 'stock' },
  KDP: { name: 'Keurig Dr Pepper', type: 'stock' },
  ET: { name: 'Energy Transfer LP', type: 'stock' },
  CSX: { name: 'CSX Corporation', type: 'stock' },
  JEPI: { name: 'JPMorgan Equity Premium Income ETF', type: 'etf', expense_ratio: 0.35 },
  O: { name: 'Realty Income Corp', type: 'stock' },
  DOW: { name: 'Dow Inc', type: 'stock' },
  SPCX: { name: 'SpaceX', type: 'private' },
};

// Positions whose running quantity dips below zero at any point in
// the statement window - not just ones with zero Buy rows at all -
// mean part or all of the lot was opened before the earliest
// statement date (1/2/2026) and its real cost basis is lost. (VTI in
// the Roth account is the case that needs the general check: it has
// small daily-DCA buys in-window, but a much larger pre-existing lot
// was sold off before any of those buys could cover it.)
// Per user decision: no earlier statements exist, so backfill a
// synthetic opening buy (quantity = the deepest deficit the running
// balance reaches, price unknown) dated the day before the statement
// window starts, purely so Phase 4's position math doesn't go
// negative. Flagged is_synthetic=1 throughout - never treat these as
// real cost basis.
const SYNTHETIC_OPENING_LOT_DATE = '2026-01-01';
const SYNTHETIC_SOURCE = 'synthetic:pre-statement-opening-lot';

function parseMoney(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s === '') return null;
  const negative = s.startsWith('(') && s.endsWith(')');
  const cleaned = s.replace(/[()$,]/g, '');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  if (Number.isNaN(n)) return null;
  return negative ? -n : n;
}

function parseQuantity(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function parseDate(raw) {
  const [m, d, y] = raw.split('/').map((x) => parseInt(x, 10));
  return `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
}

// CDIV descriptions look like:
//   "Cash Div: R/D 2026-08-03 P/D 2026-08-05 - 33.171644 shares at 0.36664"
// Pull shares held / per-share amount out so dividend rows carry the
// same (quantity, price) shape the weekly Tiingo dividend job will use.
function parseDividendDescription(description) {
  const match = /([\d.]+)\s+shares at\s+([\d.]+)/i.exec(description || '');
  if (!match) return { quantity: null, price: null };
  return { quantity: parseFloat(match[1]), price: parseFloat(match[2]) };
}

function classify(transCode) {
  switch (transCode) {
    case 'Buy':
      return 'buy';
    case 'Sell':
      return 'sell';
    case 'CDIV':
      return 'dividend';
    case 'ACH':
    case 'RTP':
    case 'CFIR':
      return 'deposit';
    case 'INT':
    case 'MTCH':
      return 'interest';
    case 'FUTSWP':
      return 'adjustment';
    default:
      return null; // skip unrecognized/blank rows
  }
}

function firstLine(description) {
  if (!description) return null;
  return description.split('\n')[0].trim();
}

function upsertAccount(name, type) {
  db.prepare('INSERT OR IGNORE INTO accounts (name, type) VALUES (?, ?)').run(name, type);
  return db.prepare('SELECT id FROM accounts WHERE name = ?').get(name).id;
}

function upsertSecurity(symbol) {
  const meta = SECURITY_META[symbol];
  if (!meta) {
    throw new Error(`No SECURITY_META entry for symbol "${symbol}" - add one before seeding.`);
  }
  db.prepare(
    'INSERT OR IGNORE INTO securities (symbol, name, type) VALUES (?, ?, ?)'
  ).run(symbol, meta.name, meta.type);
  // INSERT OR IGNORE no-ops on a symbol already seeded, so backfill
  // expense_ratio separately - otherwise re-running seed.js after
  // adding a new SECURITY_META field would never apply it to rows
  // inserted before that field existed.
  db.prepare('UPDATE securities SET expense_ratio = ? WHERE symbol = ?').run(meta.expense_ratio ?? null, symbol);
  return db.prepare('SELECT id FROM securities WHERE symbol = ?').get(symbol).id;
}

const DATE_RE = /^\d{1,2}\/\d{1,2}\/\d{4}$/;

function loadRows(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  // Robinhood appends a blank line and a disclaimer footer row (extra
  // column, throws off strict column-count parsing) after the real
  // data - relax_column_count survives it, then we drop anything
  // whose Activity Date isn't an actual date.
  const rows = parse(raw, { columns: true, skip_empty_lines: true, bom: true, relax_column_count: true });
  return rows.filter((row) => DATE_RE.test(row['Activity Date']));
}

function seed() {
  const insertTxn = db.prepare(`
    INSERT INTO transactions
      (account_id, security_id, type, quantity, price, fee, amount, executed_at, is_synthetic, source, description)
    VALUES
      (@account_id, @security_id, @type, @quantity, @price, @fee, @amount, @executed_at, @is_synthetic, @source, @description)
  `);

  const clearSource = db.prepare('DELETE FROM transactions WHERE source = ?');

  const summary = { accounts: 0, securities: 0, transactions: 0, skipped: 0, synthetic: 0 };

  const insertAll = db.transaction(() => {
    // Running-quantity ledger for the synthetic opening-lot backfill,
    // built while walking the real rows below. Keyed by account+symbol
    // (not symbol alone) since the same symbol can hold separate
    // positions in both accounts.
    const ledger = {}; // "accountId:symbol" -> { accountId, symbol, qty, minQty }

    for (const { file, accountName, accountType } of STATEMENT_FILES) {
      const accountId = upsertAccount(accountName, accountType);
      summary.accounts += 1;

      clearSource.run(file);

      const rows = loadRows(path.join(RAW_DIR, file));

      for (const row of rows) {
        const type = classify(row['Trans Code']);
        if (!type) {
          summary.skipped += 1;
          continue;
        }

        const symbol = (row['Instrument'] || '').trim();
        let securityId = null;
        if (symbol) {
          securityId = upsertSecurity(symbol);
        }

        let quantity = parseQuantity(row['Quantity']);
        let price = parseMoney(row['Price']);
        const amount = parseMoney(row['Amount']);
        const description = row['Description'] || null;

        if (type === 'dividend') {
          const parsed = parseDividendDescription(description);
          quantity = parsed.quantity;
          price = parsed.price;
        }

        insertTxn.run({
          account_id: accountId,
          security_id: securityId,
          type,
          quantity,
          price,
          fee: 0,
          amount: amount ?? 0,
          executed_at: parseDate(row['Activity Date']),
          is_synthetic: 0,
          source: file,
          description: description ? firstLine(description) : null,
        });
        summary.transactions += 1;

        if ((type === 'buy' || type === 'sell') && symbol) {
          const key = `${accountId}:${symbol}`;
          if (!ledger[key]) ledger[key] = { accountId, symbol, qty: 0, minQty: 0 };
          const entry = ledger[key];
          entry.qty += type === 'buy' ? (quantity || 0) : -(quantity || 0);
          if (entry.qty < entry.minQty) entry.minQty = entry.qty;
        }
      }
    }

    summary.securities = db.prepare('SELECT COUNT(*) AS n FROM securities').get().n;

    // Backfill a synthetic opening lot for every account+symbol whose
    // running balance dipped below zero at some point - sized to the
    // deepest deficit reached, not just the final one, since a later
    // buy can partially mask an earlier shortfall without covering it
    // at the time it happened.
    clearSource.run(SYNTHETIC_SOURCE);

    for (const { accountId, symbol, minQty } of Object.values(ledger)) {
      if (minQty >= 0) continue; // never went negative, no gap to fill

      const shortfall = -minQty;
      const securityId = upsertSecurity(symbol);
      insertTxn.run({
        account_id: accountId,
        security_id: securityId,
        type: 'buy',
        quantity: shortfall,
        price: null,
        fee: 0,
        amount: 0,
        executed_at: SYNTHETIC_OPENING_LOT_DATE,
        is_synthetic: 1,
        source: SYNTHETIC_SOURCE,
        description: 'Synthetic opening lot - pre-dates available statements, cost basis unknown',
      });
      summary.transactions += 1;
      summary.synthetic += 1;
    }
  });

  insertAll();
  return summary;
}

const summary = seed();
console.log('Seed complete:', summary);
