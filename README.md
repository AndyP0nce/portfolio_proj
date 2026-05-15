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

### 1. Open Locally
Just open `index.html` in any browser — no server needed for most features.

### 2. Live Prices (Finnhub)
1. Get a free API key at **finnhub.io**
2. Open `pages/live/dashboard.html`
3. Paste your key in the input and hit CONNECT
4. Key is saved in your browser — never sent anywhere else

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
| Finnhub | Yes | Free | 60 calls/min · Real-time stocks |
| CoinGecko | No | Free | Crypto prices · No auth needed |

## Last Updated
May 15, 2026 — From Robinhood screenshots
