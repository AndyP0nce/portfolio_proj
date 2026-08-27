// Phase 6: historical EOD prices + dividends, server-side. TIINGO_KEY
// lives in .env. Not wired to an endpoint yet - Phase 9's weekly
// dividend sync and any historical backfill are the callers.

const config = require('../config');

const BASE = 'https://api.tiingo.com/tiingo';

async function tiingoFetch(path, params = {}) {
  if (!config.tiingoKey) throw new Error('TIINGO_KEY not set in .env');
  const url = new URL(`${BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value != null) url.searchParams.set(key, value);
  }
  url.searchParams.set('token', config.tiingoKey);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Tiingo ${path} failed: ${res.status}`);
  return res.json();
}

// Daily EOD prices for a symbol between two dates (YYYY-MM-DD).
function getDailyPrices(symbol, { from, to } = {}) {
  return tiingoFetch(`/daily/${symbol}/prices`, { startDate: from, endDate: to });
}

// Tiingo has no separate dividends endpoint - dividend-paying days show
// up as divCash > 0 rows on the same daily-prices series.
async function getDividends(symbol, { from, to } = {}) {
  const rows = await getDailyPrices(symbol, { from, to });
  return rows.filter((r) => r.divCash > 0).map((r) => ({ date: r.date, amount: r.divCash }));
}

module.exports = { getDailyPrices, getDividends };
