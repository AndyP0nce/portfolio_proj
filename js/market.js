/* ══════════════════════════════════════════
   MARKET UTILS — Session, Clocks, Status
   ══════════════════════════════════════════ */

/**
 * Returns current NYSE market session
 * Based on ET timezone (PT = ET - 3hrs)
 */
function getMarketSession() {
  const now = new Date();
  const et  = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day  = et.getDay(); // 0=Sun, 6=Sat
  const mins = et.getHours() * 60 + et.getMinutes();

  if (day === 0 || day === 6) return 'closed';
  if (mins >= 60  && mins < 570)  return 'pre';    // 1:00am–9:30am ET
  if (mins >= 570 && mins < 960)  return 'open';   // 9:30am–4:00pm ET
  if (mins >= 960 && mins < 1200) return 'after';  // 4:00pm–8:00pm ET
  return 'closed';
}

/**
 * Updates clock elements
 */
function updateClocks() {
  const now = new Date();
  const ptEl = document.getElementById('ptClock');
  const etEl = document.getElementById('etClock');
  if (ptEl) ptEl.textContent = now.toLocaleTimeString('en-US', { timeZone:'America/Los_Angeles', hour12:true, hour:'2-digit', minute:'2-digit', second:'2-digit' });
  if (etEl) etEl.textContent = now.toLocaleTimeString('en-US', { timeZone:'America/New_York',    hour12:true, hour:'2-digit', minute:'2-digit', second:'2-digit' });
}

/**
 * Updates status bar dot + text
 */
function updateMarketStatus() {
  const session = getMarketSession();
  const dot = document.getElementById('statusDot');
  const txt = document.getElementById('statusText');
  if (!dot || !txt) return;

  const config = {
    open:   { cls:'dot-open',   text:'🟢 MARKET OPEN',   color:'var(--green)'  },
    pre:    { cls:'dot-pre',    text:'🟡 PRE-MARKET',    color:'var(--amber)'  },
    after:  { cls:'dot-after',  text:'🟣 AFTER-HOURS',   color:'var(--purple)' },
    closed: { cls:'dot-closed', text:'⬛ MARKET CLOSED', color:'var(--muted)'  },
  };

  const c = config[session];
  dot.className = 'dot ' + c.cls;
  txt.textContent  = c.text;
  txt.style.color  = c.color;
}

/**
 * Updates session banner
 */
function updateSessionBanner() {
  const session = getMarketSession();
  const banner  = document.getElementById('sessionBanner');
  const title   = document.getElementById('bannerTitle');
  const sub     = document.getElementById('bannerSub');
  const right   = document.getElementById('bannerRight');
  if (!banner) return;

  const configs = {
    open:   { cls:'banner-open',   title:'<span style="color:var(--green)">🟢 Market Is Open</span>',    sub:'NYSE/NASDAQ LIVE · PT 6:30 AM – 1:00 PM · Prices every 15s',  right:'Next close: 1:00 PM PT' },
    pre:    { cls:'banner-pre',    title:'<span style="color:var(--amber)">🟡 Pre-Market Session</span>', sub:'Limited liquidity · PT 1:00 AM – 6:30 AM',                     right:'Market opens: 6:30 AM PT' },
    after:  { cls:'banner-after',  title:'<span style="color:var(--purple)">🟣 After-Hours</span>',       sub:'Extended hours · Lower volume · PT 1:00 PM – 5:00 PM',         right:'Tomorrow: 6:30 AM PT' },
    closed: { cls:'banner-closed', title:'<span style="color:var(--muted)">⬛ Market Closed</span>',      sub:'Showing last known prices · Weekends/holidays',                 right:'Next open: Mon 6:30 AM PT' },
  };

  const c = configs[session];
  banner.className  = 'banner ' + c.cls;
  if (title)  title.innerHTML  = c.title;
  if (sub)    sub.textContent  = c.sub;
  if (right)  right.textContent = c.right;
}

/** Start clock ticking */
function startClocks() {
  updateClocks();
  updateMarketStatus();
  updateSessionBanner();
  setInterval(() => {
    updateClocks();
    updateMarketStatus();
    updateSessionBanner();
  }, 1000);
}
