/* ══════════════════════════════════════════
   PRICE FETCHING — Finnhub (server-side, stocks + crypto)
   ══════════════════════════════════════════ */

// Finnhub quotes are fetched through the local API server now (see
// server/lib/finnhub.js) - it holds FINNHUB_KEY in .env, so the
// frontend never handles a key at all. Crypto (BTC/ETH/DOGE) goes
// through the same endpoint - server/lib/finnhub.js maps those to
// their Binance pairs before calling Finnhub, so there's a single
// price source and a single request path for everything.
const API_BASE = 'http://localhost:3000';

const liveData = {};
let apiConnected = false;

// Last real Finnhub quote per symbol, kept in localStorage so a reload
// (or a moment where the local API is unreachable) starts from the
// last known-good live price instead of falling back to avgCost - a
// fabricated, always-zero-gain number that has nothing to do with what
// the market is actually doing. Cleared/replaced the instant a fresh
// quote lands; never expired, since a stale real price is still a much
// better default than cost basis, especially over a market-closed
// weekend.
const QUOTE_CACHE_KEY = 'stock_quote_cache';

function loadCachedQuotes() {
  try {
    const cached = JSON.parse(localStorage.getItem(QUOTE_CACHE_KEY) || 'null');
    if (cached) Object.assign(liveData, cached);
  } catch (e) { /* corrupt/missing cache - fall through to per-row avgCost */ }
}

function cacheQuotes(newData) {
  try {
    const cached = JSON.parse(localStorage.getItem(QUOTE_CACHE_KEY) || 'null') || {};
    Object.assign(cached, newData);
    localStorage.setItem(QUOTE_CACHE_KEY, JSON.stringify(cached));
  } catch (e) { /* storage full/blocked - just skip caching this round */ }
}

/** Seed liveData with the last known-good quote for every symbol
 *  (localStorage cache). Anything still unseeded after this (first
 *  visit, empty cache) falls back to its own row's avgCost - every
 *  renderer already does that per-holding when liveData[sym] is unset. */
function seedPrices() {
  loadCachedQuotes();
}

/** Fetch live quotes (stocks, ETFs, and crypto alike) for the given
 *  holdings from the local API's /api/quotes. */
async function fetchQuotes(holdings) {
  // 'private' holdings (e.g. SPCX/SpaceX) aren't publicly quotable -
  // Finnhub's free tier can silently match an unrelated real ticker
  // with the same letters instead of erroring, so these must never be
  // requested at all rather than trusting whatever price comes back.
  const quotable = holdings.filter(h => h.type !== 'private');
  const symbols = [...new Set(quotable.map(h => h.sym))];
  let hits = 0;

  let quotes;
  try {
    const res = await fetch(`${API_BASE}/api/quotes?symbols=${symbols.join(',')}`);
    if (!res.ok) throw new Error('quotes request failed');
    quotes = await res.json();
  } catch (e) {
    apiConnected = false;
    updateApiIndicator(0, quotable.length);
    updateLastUpdate();
    return;
  }

  const bySymbol = Object.fromEntries(quotes.map(q => [q.symbol, q]));
  const fresh = {};

  quotable.forEach(h => {
    const d = bySymbol[h.sym];
    if (!d) return;
    const prev = liveData[h.sym]?.c || h.avgCost;
    liveData[h.sym] = fresh[h.sym] = { c: d.c, pc: d.pc, h: d.h, l: d.l, dp: d.dp, d: d.d };
    // Flash row if price changed
    if (prev !== d.c) {
      const row = document.getElementById('row-' + h.sym);
      if (row) {
        row.classList.remove('flash-g', 'flash-r');
        void row.offsetWidth;
        row.classList.add(d.c > prev ? 'flash-g' : 'flash-r');
      }
    }
    hits++;
  });

  if (hits > 0) cacheQuotes(fresh);
  apiConnected = hits > 0;
  updateApiIndicator(hits, quotable.length);
  updateLastUpdate();
}

/** Update API connected indicator in UI */
function updateApiIndicator(hits, total) {
  const dot   = document.getElementById('apiDot');
  const label = document.getElementById('apiLabel');
  if (!dot || !label) return;

  if (apiConnected) {
    dot.style.background  = 'var(--green)';
    dot.style.boxShadow   = '0 0 6px var(--green)';
    label.style.color     = 'var(--green)';
    label.textContent     = `Finnhub LIVE · ${hits}/${total}`;
  } else {
    dot.style.background  = 'var(--red)';
    label.style.color     = 'var(--red)';
    label.textContent     = 'API: server unreachable';
  }
}

/** Update last refresh timestamp */
function updateLastUpdate() {
  const el = document.getElementById('lastUpdate');
  if (!el) return;
  el.textContent = new Date().toLocaleTimeString('en-US', {
    timeZone: 'America/Los_Angeles',
    hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit'
  }) + ' PT';
}

/** Full refresh: all holdings (stocks + crypto) in one Finnhub call */
async function refreshPrices(holdings) {
  await fetchQuotes(holdings);
}

/** Start auto-refresh loop */
function startPriceRefresh(renderFn, holdings) {
  // Refresh every 15s when open, every 5min when closed
  setInterval(() => {
    if (getMarketSession() === 'open') refreshPrices(holdings).then(renderFn);
  }, 15000);

  setInterval(() => {
    if (getMarketSession() !== 'open') refreshPrices(holdings).then(renderFn);
  }, 300000);

  // Fast reconnect: while the local API is down, retry every 5s
  // regardless of market session, instead of sitting on the last
  // cached quotes for however long is left on the interval above -
  // recovers as soon as the server comes back up.
  setInterval(() => {
    if (!apiConnected) refreshPrices(holdings).then(renderFn);
  }, 5000);
}
