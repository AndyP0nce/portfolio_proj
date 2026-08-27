// Phase 5: bootstrap recurring_config from the known daily DCA plan
// (all in the taxable account). This is manually-specified config, not
// something derivable from the Robinhood statements, so it's seeded
// separately from seed.js. Safe to re-run - clears each symbol's row
// before reinserting so amounts can be adjusted by editing the list
// below and rerunning, though going forward the plan is to edit
// recurring_config directly (or via an API) without touching this file.

const db = require('../db/connection');

const DAILY_DCA = [
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', amount: 1.00 },
  { symbol: 'CSX', amount: 2.25 },
  { symbol: 'ET', amount: 3.50 },
  { symbol: 'IBM', amount: 3.50 },
  { symbol: 'NVDA', amount: 5.00 },
  { symbol: 'SCHD', amount: 5.15 },
  { symbol: 'SPY', amount: 4.00 },
];

function upsertSecurity({ symbol, name, type }) {
  const existing = db.prepare('SELECT id FROM securities WHERE symbol = ?').get(symbol);
  if (existing) return existing.id;
  db.prepare('INSERT INTO securities (symbol, name, type) VALUES (?, ?, ?)').run(symbol, name || null, type || 'stock');
  return db.prepare('SELECT id FROM securities WHERE symbol = ?').get(symbol).id;
}

function seedRecurring() {
  const accountId = db.prepare("SELECT id FROM accounts WHERE type = 'taxable'").get().id;

  const clear = db.prepare('DELETE FROM recurring_config WHERE security_id = ? AND account_id = ?');
  const insert = db.prepare(`
    INSERT INTO recurring_config (security_id, account_id, amount_usd, frequency, active)
    VALUES (@security_id, @account_id, @amount_usd, 'daily', 1)
  `);

  const runSeed = db.transaction(() => {
    let n = 0;
    for (const { symbol, name, type, amount } of DAILY_DCA) {
      const securityId = upsertSecurity({ symbol, name, type });
      clear.run(securityId, accountId);
      insert.run({ security_id: securityId, account_id: accountId, amount_usd: amount });
      n += 1;
    }
    return n;
  });

  return runSeed();
}

const n = seedRecurring();
console.log(`Seeded ${n} recurring_config rows.`);
