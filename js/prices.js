/* ══════════════════════════════════════════
   PRICE FETCHING — Finnhub + CoinGecko
   ══════════════════════════════════════════ */

const liveData = {};
let apiKey = localStorage.getItem('finnhub_key') || '';
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

/** Save Finnhub API key */
function saveApiKey(key) {
  if (!key) return;
  apiKey = key.trim();
  localStorage.setItem('finnhub_key', apiKey);
}

/** Load key from storage into input if present */
function loadApiKey() {
  const input = document.getElementById('apiKeyInput');
  if (input && apiKey) {
    input.value = apiKey;
  }
}

/** Fetch all stock/ETF prices from Finnhub */
async function fetchStocks() {
  if (!apiKey) return;
  const holdings = [...TAXABLE, ...ROTH];
  let hits = 0;

  for (const h of holdings) {
    try {
      const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${h.sym}&token=${apiKey}`);
      if (!res.ok) continue;
      const d = await res.json();
      if (d.c && d.c > 0) {
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
      }
      await new Promise(r => setTimeout(r, 120)); // rate limit spacing
    } catch(e) { /* keep seed */ }
  }

  apiConnected = hits > 0;
  updateApiIndicator(hits, holdings.length);
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
    label.textContent     = 'API: Check key';
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
