/* ══════════════════════════════════════════
   CHARTS PAGE
   ══════════════════════════════════════════ */
document.getElementById('pageRoot').innerHTML = `
  <div style="font-family:var(--font-title);font-size:30px;letter-spacing:1px;margin-bottom:20px;">
    PORTFOLIO <span style="color:var(--green)">CHARTS</span>
  </div>
  <div class="cards2" style="margin-bottom:16px;">
    <div class="chart-card"><div class="chart-title">All-Time P&L</div><div class="chart-sub">DOLLAR GAIN/LOSS FROM COST BASIS</div><canvas id="plChart" height="280"></canvas></div>
    <div class="chart-card"><div class="chart-title">Annual Dividends</div><div class="chart-sub">ESTIMATED $/YR BY HOLDING</div><canvas id="divChart" height="280"></canvas></div>
  </div>
  <div class="cards2">
    <div class="chart-card"><div class="chart-title">Portfolio Allocation</div><div class="chart-sub">% OF TOTAL BY HOLDING</div><canvas id="allocChart" height="280"></canvas></div>
    <div class="chart-card"><div class="chart-title">Daily DCA Split</div><div class="chart-sub">WHERE YOUR $25.90/DAY GOES</div><canvas id="dcaChart" height="280"></canvas></div>
  </div>
`;

seedPrices();
const allHoldings = [...TAXABLE, ...ROTH, ...TAXABLE_CRYPTO];
buildPLChart('plChart', allHoldings);
buildDivChart('divChart');
buildAllocChart('allocChart');
buildDCAChart('dcaChart');
