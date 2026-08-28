// Phase 6: live quotes, server-side. FINNHUB_KEY lives in .env now -
// the frontend never sees it.

const config = require('../config');

const BASE = 'https://finnhub.io/api/v1';

// Finnhub's /quote endpoint also prices crypto, given an
// exchange-prefixed pair (e.g. BINANCE:BTCUSDT) instead of a bare
// ticker - confirmed against the live API. Everything else (stocks,
// ETFs) is requested by its plain symbol as before.
const CRYPTO_SYMBOLS = {
  BTC: 'BINANCE:BTCUSDT',
  ETH: 'BINANCE:ETHUSDT',
  DOGE: 'BINANCE:DOGEUSDT',
};

async function getFinnhubQuote(finnhubSymbol) {
  const url = `${BASE}/quote?symbol=${encodeURIComponent(finnhubSymbol)}&token=${config.finnhubKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Finnhub quote for ${finnhubSymbol} failed: ${res.status}`);
  return res.json();
}

// CoinGecko needs no key, so it's kept as a fallback for crypto only -
// Finnhub's free tier rate-limits its Binance-pair crypto quotes more
// aggressively than its stock quotes in practice, and a DCA cron run
// or a live-dashboard refresh landing on a rate-limited moment
// shouldn't just go unpriced for the day/cycle when a keyless backup
// is one call away.
const COINGECKO_IDS = { BTC: 'bitcoin', ETH: 'ethereum', DOGE: 'dogecoin' };

async function getCoinGeckoQuote(symbol) {
  const id = COINGECKO_IDS[symbol];
  if (!id) return null;
  const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`);
  if (!res.ok) return null;
  const data = await res.json();
  const d = data[id];
  if (!d || !d.usd) return null;
  const changePct = d.usd_24h_change || 0;
  return { c: d.usd, pc: d.usd / (1 + changePct / 100), h: null, l: null, dp: changePct, d: null };
}

async function getQuote(symbol) {
  if (!config.finnhubKey) throw new Error('FINNHUB_KEY not set in .env');
  const finnhubSymbol = CRYPTO_SYMBOLS[symbol] || symbol;

  if (!CRYPTO_SYMBOLS[symbol]) return getFinnhubQuote(finnhubSymbol);

  try {
    const quote = await getFinnhubQuote(finnhubSymbol);
    if (quote && quote.c > 0) return quote;
    throw new Error('empty Finnhub quote');
  } catch {
    const fallback = await getCoinGeckoQuote(symbol);
    if (fallback) return fallback;
    throw new Error(`no quote available for ${symbol} (Finnhub and CoinGecko both failed)`);
  }
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
