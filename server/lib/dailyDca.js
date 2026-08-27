// Phase 9: the daily DCA job. Scheduled from index.js (node-cron, 22:00
// America/New_York) - the logic lives here, not inline in index.js, to
// match how every other phase's business logic sits in server/lib/
// rather than in the route file.
//
// For each active recurring_config row: fetch today's price, buy
// amount_usd / price shares, and record it as a real transaction row
// (is_synthetic=0, source='cron:daily-dca') - exactly like a real
// Robinhood DCA buy would show up in a statement. Also snapshots
// today's closing price into price_history for every security, DCA'd
// or not, so /api/prices stays populated.

const db = require('../db/connection');
const { getQuote } = require('./finnhub');

const CRON_SOURCE = 'cron:daily-dca';

// Finnhub's free tier prices stocks/ETFs, not crypto tickers like
// BTC/ETH/DOGE the way its /quote endpoint expects - CoinGecko (same
// source the frontend already uses, no key needed) covers those.
const COINGECKO_IDS = { BTC: 'bitcoin', ETH: 'ethereum', DOGE: 'dogecoin' };

async function getCryptoPrice(symbol) {
  const id = COINGECKO_IDS[symbol];
  if (!id) return null;
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
    if (!res.ok) return null;
    const data = await res.json();
    return data[id]?.usd ?? null;
  } catch {
    return null;
  }
}

async function getStockPrice(symbol) {
  try {
    const quote = await getQuote(symbol);
    return quote && quote.c > 0 ? quote.c : null;
  } catch {
    return null;
  }
}

function getPrice(security) {
  // 'private' securities (e.g. SPCX/SpaceX) aren't publicly quotable -
  // Finnhub's free-tier /quote endpoint doesn't error on an unknown
  // symbol, it can silently match an unrelated real ticker that
  // happens to share the same letters, so this must never be sent to
  // Finnhub at all rather than trusting a >0 price back.
  if (security.type === 'private') return null;
  return security.type === 'crypto' ? getCryptoPrice(security.symbol) : getStockPrice(security.symbol);
}

async function runDailyDca(runDate = new Date()) {
  const today = runDate.toISOString().slice(0, 10);
  const summary = { date: today, bought: [], skipped_duplicate: [], skipped_no_price: [], snapshotted: [] };

  // One price lookup per symbol per run, reused for both the DCA buy
  // and the price_history snapshot below.
  const priceCache = new Map();
  async function priceFor(security) {
    if (!priceCache.has(security.symbol)) {
      priceCache.set(security.symbol, await getPrice(security));
    }
    return priceCache.get(security.symbol);
  }

  const activeRecurring = db.prepare(`
    SELECT r.account_id, r.security_id, r.amount_usd, s.symbol, s.type
    FROM recurring_config r
    JOIN securities s ON s.id = r.security_id
    WHERE r.active = 1
  `).all();

  const alreadyBought = db.prepare(`
    SELECT 1 FROM transactions WHERE source = ? AND security_id = ? AND executed_at = ?
  `);
  const insertBuy = db.prepare(`
    INSERT INTO transactions
      (account_id, security_id, type, quantity, price, fee, amount, executed_at, is_synthetic, source, description)
    VALUES
      (@account_id, @security_id, 'buy', @quantity, @price, 0, @amount, @executed_at, 0, @source, @description)
  `);

  for (const row of activeRecurring) {
    if (alreadyBought.get(CRON_SOURCE, row.security_id, today)) {
      summary.skipped_duplicate.push(row.symbol);
      continue;
    }

    const price = await priceFor(row);
    if (!price) {
      summary.skipped_no_price.push(row.symbol);
      continue;
    }

    insertBuy.run({
      account_id: row.account_id,
      security_id: row.security_id,
      quantity: row.amount_usd / price,
      price,
      amount: -row.amount_usd,
      executed_at: today,
      source: CRON_SOURCE,
      description: `Daily DCA buy - $${row.amount_usd}/day`,
    });
    summary.bought.push({ symbol: row.symbol, price, amount: row.amount_usd });
  }

  const allSecurities = db.prepare('SELECT id, symbol, type FROM securities').all();
  const alreadySnapshotted = db.prepare('SELECT 1 FROM price_history WHERE security_id = ? AND as_of = ?');
  const insertSnapshot = db.prepare(`
    INSERT INTO price_history (security_id, price, as_of, source) VALUES (?, ?, ?, ?)
  `);

  for (const security of allSecurities) {
    if (alreadySnapshotted.get(security.id, today)) continue;
    const price = await priceFor(security);
    if (!price) continue;
    insertSnapshot.run(security.id, price, today, security.type === 'crypto' ? 'coingecko' : 'finnhub');
    summary.snapshotted.push(security.symbol);
  }

  return summary;
}

module.exports = { runDailyDca, CRON_SOURCE };
