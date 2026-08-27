// Phase 6: live quotes, server-side. FINNHUB_KEY lives in .env now -
// the frontend never sees it.

const config = require('../config');

const BASE = 'https://finnhub.io/api/v1';

async function getQuote(symbol) {
  if (!config.finnhubKey) throw new Error('FINNHUB_KEY not set in .env');
  const url = `${BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${config.finnhubKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Finnhub quote for ${symbol} failed: ${res.status}`);
  return res.json();
}

// Free-tier Finnhub is rate-limited (60 calls/min), so quotes are
// fetched one at a time with the same spacing the frontend used to do
// client-side - just moved server-side. A symbol that errors or comes
// back with no price (c <= 0, Finnhub's "unknown symbol" shape) is
// dropped rather than failing the whole batch, so the frontend can
// keep showing its seed price for that one row.
async function getQuotes(symbols) {
  const results = [];
  for (const symbol of symbols) {
    try {
      const q = await getQuote(symbol);
      if (q && q.c > 0) {
        results.push({ symbol, c: q.c, pc: q.pc, h: q.h, l: q.l, dp: q.dp, d: q.d });
      }
    } catch {
      // skip - frontend falls back to its seed price for this symbol
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  return results;
}

module.exports = { getQuote, getQuotes };
