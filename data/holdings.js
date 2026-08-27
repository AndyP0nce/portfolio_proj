/* ══════════════════════════════════════════
   HOLDINGS DATA — Aug 27, 2026
   Update shares here as DCA adds more
   ══════════════════════════════════════════ */

const LAST_UPDATED = 'Aug 27, 2026';

// CSX and SPCX were previously missing from this file entirely - CSX
// is a real active taxable position with its own daily DCA, SPCX is
// the (illiquid, non-quotable) SpaceX private shares. CSX/IBM avgCost
// pulled from computePositions() (server/lib/positions.js) - derived
// from real transaction history, not hand-entered.
const TAXABLE = [
  { sym:'SPY',  name:'S&P 500 ETF',          shares:4.38,  avgCost:536.00, divYield:1.1,  color:'var(--blue)',   seedPrice:769.41, account:'taxable', dca:4.00, expRatio:0.09, risk:'LOW'  },
  { sym:'SCHD', name:'Dividend Growth ETF',   shares:91.96, avgCost:25.44,  divYield:3.4,  color:'var(--green)',  seedPrice:34.91,  account:'taxable', dca:5.15, expRatio:0.06, risk:'LOW'  },
  { sym:'TQQQ', name:'3× Leveraged Nasdaq',   shares:16.53, avgCost:28.37,  divYield:0,    color:'var(--red)',    seedPrice:72.60,  account:'taxable', dca:0,    expRatio:0.88, risk:'HIGH' },
  { sym:'NVDA', name:'NVIDIA Corp · AI/GPU',  shares:3.71,  avgCost:97.82,  divYield:0.03, color:'var(--teal)',   seedPrice:224.13, account:'taxable', dca:5.00, expRatio:0,    risk:'MED'  },
  { sym:'KDP',  name:'Keurig Dr Pepper',      shares:27.40, avgCost:29.20,  divYield:3.4,  color:'var(--amber)',  seedPrice:31.90,  account:'taxable', dca:0,    expRatio:0,    risk:'LOW'  },
  { sym:'ET',   name:'Energy Transfer LP',    shares:35.92, avgCost:20.10,  divYield:7.8,  color:'var(--orange)', seedPrice:21.49,  account:'taxable', dca:3.50, expRatio:0,    risk:'MED'  },
  { sym:'CSX',  name:'CSX Corporation',       shares:15.15, avgCost:49.32,  divYield:1.4,  color:'var(--pink)',   seedPrice:51.31,  account:'taxable', dca:2.25, expRatio:0,    risk:'LOW'  },
  { sym:'IBM',  name:'IBM Corp · AI/Cloud',   shares:5.19,  avgCost:218.67, divYield:2.9,  color:'var(--blue)',   seedPrice:229.29, account:'taxable', dca:3.50, expRatio:0,    risk:'LOW'  },
  { sym:'SPCX', name:'SpaceX',                shares:1,     avgCost:140.70, divYield:0,    color:'var(--muted)',  seedPrice:140.52, account:'taxable', dca:0,    expRatio:0,    risk:'MED', type:'private' },
];

const TAXABLE_CRYPTO = [
  { sym:'BTC',  name:'Bitcoin',  coins:0.01176942, avgCost:88894, seedPrice:79644, dca:1.00, color:'var(--purple)' },
  { sym:'ETH',  name:'Ethereum', coins:0.051097,   avgCost:2743,  seedPrice:2512,  dca:0,    color:'var(--purple)' },
  { sym:'DOGE', name:'Dogecoin', coins:520.03,     avgCost:0.177, seedPrice:0.088, dca:0,    color:'var(--red)'    },
];

const ROTH = [
  { sym:'AVUV', name:'Small Cap Value ETF',   shares:18.73, avgCost:92.93,  divYield:1.5,  color:'var(--pink)',   seedPrice:126.91, account:'roth', dca:7.00, expRatio:0.25, risk:'MED'  },
  { sym:'VXUS', name:'International ETF',     shares:26.70, avgCost:65.67,  divYield:3.2,  color:'var(--teal)',   seedPrice:88.00,  account:'roth', dca:5.80, expRatio:0.07, risk:'LOW'  },
  { sym:'JEPI', name:'Covered Call Income',   shares:33.38, avgCost:57.14,  divYield:8.2,  color:'var(--purple)', seedPrice:58.16,  account:'roth', dca:4.75, expRatio:0.35, risk:'MED'  },
  { sym:'IBM',  name:'IBM Corp · AI/Cloud',   shares:5.76,  avgCost:258.00, divYield:2.9,  color:'var(--blue)',   seedPrice:229.90, account:'roth', dca:0,    expRatio:0,    risk:'LOW'  },
];

/* DCA SUMMARY */
const DCA = {
  rothDaily:    17.55, // $7 AVUV + $5.80 VXUS + $4.75 JEPI
  taxableDaily: 24.40, // $4 SPY + $5.15 SCHD + $3.50 ET + $5 NVDA + $2.25 CSX + $3.50 IBM + $1 BTC
  rothMatch:    0.03,  // 3% Robinhood Gold on Roth
  taxableMatch: 0.01,  // 1% Robinhood Gold on Taxable
};

/* IRA STATUS 2026 */
const IRA_2026 = {
  contributed: 1877.00,
  matchEarned: 56.31,
  limit:        7500.00,
};

/* HELPERS */
function totalAnnualDCA() {
  const ira = DCA.rothDaily * 365;
  const tax = DCA.taxableDaily * 365;
  return ira + tax + (ira * DCA.rothMatch) + (tax * DCA.taxableMatch);
}
