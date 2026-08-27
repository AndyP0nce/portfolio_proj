/* ══════════════════════════════════════════
   PRICE FETCHING — Finnhub (server-side) + CoinGecko
   ══════════════════════════════════════════ */

// Finnhub quotes are fetched through the local API server now (see
// server/lib/finnhub.js) - it holds FINNHUB_KEY in .env, so the
// frontend never handles a key at all.
const API_BASE = 'http://localhost:3000';

const liveData = {};
let apiConnected = false;

/** Seed all holdings with last known prices */
function seedPrices() {
  [...TAXABLE, ...ROTH].forEach(h => {
    liveData[h.sym] = { c: h.seedPrice, pc: h.seedPrice, h: h.seedPrice * 1.01, l: h.seedPrice * 0.99, dp: 0 };
  });
  TAXABLE_CRYPTO.forEach(c => {
    liveData[c.sym] = { c: c.seedPrice, pc: c.seedPrice, dp: 0 };
  });
}

/** Fetch all stock/ETF prices from the local API's /api/quotes */
async function fetchStocks() {
  const holdings = [...TAXABLE, ...ROTH];
  const symbols = [...new Set(holdings.map(h => h.sym))];
  let hits = 0;

  let quotes;
  try {
    const res = await fetch(`${API_BASE}/api/quotes?symbols=${symbols.join(',')}`);
    if (!res.ok) throw new Error('quotes request failed');
    quotes = await res.json();
  } catch (e) {
    apiConnected = false;
    updateApiIndicator(0, symbols.length);
    updateLastUpdate();
    return;
  }

  const bySymbol = Object.fromEntries(quotes.map(q => [q.symbol, q]));

  holdings.forEach(h => {
    const d = bySymbol[h.sym];
    if (!d) return;
    const prev = liveData[h.sym]?.c || h.seedPrice;
    liveData[h.sym] = { c: d.c, pc: d.pc, h: d.h, l: d.l, dp: d.dp, d: d.d };
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

  apiConnected = hits > 0;
  updateApiIndicator(hits, symbols.length);
  updateLastUpdate();
}

/** Fetch crypto from CoinGecko (no key needed) */
async function fetchCrypto() {
  try {
    const ids = TAXABLE_CRYPTO.map(c => c.id || c.sym.toLowerCase()).join(',');
    const cgIds = 'bitcoin,ethereum,dogecoin';
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cgIds}&vs_currencies=usd&include_24hr_change=true`
    );
    if (!res.ok) return;
    const d = await res.json();
    const map = { BTC: d.bitcoin, ETH: d.ethereum, DOGE: d.dogecoin };
    TAXABLE_CRYPTO.forEach(c => {
      if (map[c.sym]) {
        const price = map[c.sym].usd;
        liveData[c.sym] = {
          c:  price,
          pc: price / (1 + (map[c.sym].usd_24h_change || 0) / 100),
          dp: map[c.sym].usd_24h_change || 0,
          h: null, l: null
        };
      }
    });
  } catch(e) { /* keep seed */ }
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

/** Full refresh: stocks + crypto */
async function refreshPrices() {
  await Promise.all([fetchStocks(), fetchCrypto()]);
}

/** Start auto-refresh loop */
function startPriceRefresh(renderFn) {
  // Refresh every 15s when open, every 5min when closed
  setInterval(() => {
    if (getMarketSession() === 'open') refreshPrices().then(renderFn);
  }, 15000);

  setInterval(() => {
    if (getMarketSession() !== 'open') refreshPrices().then(renderFn);
  }, 300000);
}
