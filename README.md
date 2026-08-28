# Andrew's Portfolio Tracker

Personal investment portfolio tracker with live prices, charts, projections, and tax analysis.

## Project Structure

```
portfolio-site/
├── index.html                    ← Main overview page
├── README.md                     ← This file
│
├── css/
│   ├── variables.css             ← Design tokens (colors, fonts, spacing)
│   ├── base.css                  ← Reset, global styles, animations
│   └── components.css            ← All reusable UI components
│
├── js/
│   ├── utils.js                  ← Formatting + math helpers
│   ├── market.js                 ← Market session, clocks, status
│   ├── prices.js                 ← Finnhub + CoinGecko API fetching
│   └── charts.js                 ← Reusable Chart.js builders
│
├── data/
│   └── holdings.js               ← ⭐ UPDATE THIS with your shares/prices
│
└── pages/
    ├── live/
    │   └── dashboard.html        ← Real-time prices via Finnhub API
    ├── charts/
    │   ├── charts.html
    │   └── charts.js             ← P&L, dividends, allocation, DCA charts
    ├── projection/
    │   ├── projection.html
    │   └── projection.js         ← 30-year growth projections
    └── analysis/
        ├── analysis.html
        └── analysis.js           ← Tax bracket + expense ratio analysis
```

## How to Use

### 1. Run It
```bash
npm start
```
From the project root. This starts the API server (`server/index.js`) on `http://localhost:3000`, which also serves the site itself — so that one URL is the whole app, no separate static server or editor "Live" button needed.

### 2. Live Prices (Finnhub)
Live quotes (stocks, ETFs, and crypto alike) are fetched server-side through Finnhub — set `FINNHUB_KEY` in `server/.env`. The frontend never sees the key. Crypto (BTC/ETH/DOGE) is priced via Finnhub's Binance-pair quotes, falling back to CoinGecko (no key needed) if Finnhub's crypto quote is rate-limited or empty.

### 3. Update Your Holdings
Edit **`data/holdings.js`** whenever:
- Your DCA buys add new shares
- You add a new position
- You want to update cost basis

### 4. Deploy to GitHub Pages (Free)
```bash
git init
git add .
git commit -m "portfolio tracker"
gh repo create portfolio-tracker --public
git push origin main
# Enable GitHub Pages in repo Settings > Pages > main branch
```

### 5. Deploy to AWS (Same as Livio)
- EC2 t2.micro (free tier)
- Serve with nginx or just S3 static hosting
- Route 53 for custom domain

## API Keys
| Service | Key Required | Cost | Notes |
|---------|-------------|------|-------|
| Finnhub | Yes | Free | 60 calls/min · Real-time stocks, ETFs, and crypto (via Binance pairs) |
| CoinGecko | No | Free | Crypto price fallback only, used if Finnhub's crypto quote fails |

## Last Updated
May 15, 2026 — From Robinhood screenshots
