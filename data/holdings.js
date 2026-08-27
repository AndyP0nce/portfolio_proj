/* ══════════════════════════════════════════
   HOLDINGS DATA — May 15, 2026
   Update shares here as DCA adds more
   ══════════════════════════════════════════ */

const LAST_UPDATED = 'May 15, 2026';

const TAXABLE = [
  { sym:'SPY',  name:'S&P 500 ETF',          shares:4.17,       avgCost:536.0,  divYield:1.1,  color:'var(--blue)',   seedPrice:711.61,  account:'taxable', dca:2.00,  expRatio:0.09, risk:'LOW'  },
  { sym:'SCHD', name:'Dividend Growth ETF',   shares:51.90,      avgCost:25.44,  divYield:3.4,  color:'var(--green)',  seedPrice:31.42,   account:'taxable', dca:2.10,  expRatio:0.06, risk:'LOW'  },
  { sym:'TQQQ', name:'3× Leveraged Nasdaq',   shares:14.38,      avgCost:28.37,  divYield:0,    color:'var(--red)',    seedPrice:62.17,   account:'taxable', dca:0,     expRatio:0.88, risk:'HIGH' },
  { sym:'NVDA', name:'NVIDIA Corp · AI/GPU',  shares:1.65,       avgCost:97.82,  divYield:0.03, color:'var(--teal)',   seedPrice:210.66,  account:'taxable', dca:0,     expRatio:0,    risk:'MED'  },
  { sym:'KDP',  name:'Keurig Dr Pepper',      shares:18.89,      avgCost:29.20,  divYield:3.4,  color:'var(--amber)',  seedPrice:28.76,   account:'taxable', dca:1.25,  expRatio:0,    risk:'LOW'  },
  { sym:'ET',   name:'Energy Transfer LP',    shares:7.56,       avgCost:20.10,  divYield:7.8,  color:'var(--orange)', seedPrice:20.40,   account:'taxable', dca:2.00,  expRatio:0,    risk:'MED'  },
];

const TAXABLE_CRYPTO = [
  { sym:'BTC',  name:'Bitcoin',  coins:0.01176942, avgCost:88894, seedPrice:79991, dca:1.00, color:'var(--purple)' },
  { sym:'ETH',  name:'Ethereum', coins:0.051097,   avgCost:2743,  seedPrice:2534,  dca:0,    color:'var(--purple)' },
  { sym:'DOGE', name:'Dogecoin', coins:520.03,     avgCost:0.177, seedPrice:0.0888,dca:0,    color:'var(--red)'    },
];

const ROTH = [
  { sym:'AVUV', name:'Small Cap Value ETF',   shares:17.86, avgCost:92.93,  divYield:1.5,  color:'var(--pink)',   seedPrice:118.82,  account:'roth', dca:7.00,  expRatio:0.25, risk:'MED'  },
  { sym:'VXUS', name:'International ETF',     shares:26.06, avgCost:65.67,  divYield:3.2,  color:'var(--teal)',   seedPrice:81.60,   account:'roth', dca:5.80,  expRatio:0.07, risk:'LOW'  },
  { sym:'JEPI', name:'Covered Call Income',   shares:32.27, avgCost:57.14,  divYield:8.2,  color:'var(--purple)', seedPrice:57.04,   account:'roth', dca:4.75,  expRatio:0.35, risk:'MED'  },
  { sym:'IBM',  name:'IBM Corp · AI/Cloud',   shares:5.57,  avgCost:258.0,  divYield:2.9,  color:'var(--blue)',   seedPrice:226.50,  account:'roth', dca:0,     expRatio:0,    risk:'LOW'  },
];

/* DCA SUMMARY */
const DCA = {
  rothDaily:   17.55,   // $7 AVUV + $5.80 VXUS + $4.75 JEPI
  taxableDaily: 8.35,   // $2 SPY + $2.10 SCHD + $1.25 KDP + $2 ET + $1 BTC
  rothMatch:    0.03,   // 3% Robinhood Gold on Roth
  taxableMatch: 0.01,   // 1% Robinhood Gold on Taxable
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

function estAnnualDiv(holding) {
  const price = holding.seedPrice;
  const qty   = holding.shares || holding.coins;
  return price * qty * (holding.divYield / 100);
}
