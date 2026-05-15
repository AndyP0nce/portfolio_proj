/* ══════════════════════════════════════════
   TAX & FEES ANALYSIS PAGE
   ══════════════════════════════════════════ */
document.getElementById('pageRoot').innerHTML = `
  <div style="font-family:var(--font-title);font-size:30px;letter-spacing:1px;margin-bottom:6px;">
    TAX + <span style="color:var(--amber)">FEES</span> ANALYSIS
  </div>
  <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);margin-bottom:20px;">// Under $47k income bracket · Qualified dividends taxed at 0% · Roth IRA gains tax-free forever</div>

  <div style="background:rgba(13,255,140,0.04);border:1px solid rgba(13,255,140,0.2);border-radius:10px;padding:14px 18px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
    <div>
      <div style="font-family:var(--font-title);font-size:15px;letter-spacing:1px;color:var(--green);">🟢 0% Tax Bracket — You Pay Nothing on Dividends Right Now</div>
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);margin-top:3px;">Under $47,025/yr income · Qualified divs &amp; LT capital gains both 0%</div>
    </div>
    <div style="display:flex;gap:16px;font-family:var(--font-mono);font-size:10px;color:var(--muted);flex-wrap:wrap;">
      <span>Qualified Divs <b style="color:var(--green)">0%</b></span>
      <span>LT Cap Gains <b style="color:var(--green)">0%</b></span>
      <span>ST Gains/Crypto <b style="color:var(--amber)">10-12%</b></span>
      <span>Roth IRA <b style="color:var(--green)">0% forever</b></span>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:9px;margin-bottom:20px;">
    <div class="stat-box"><div class="stat-label">Annual Div Tax Now</div><div class="stat-val green">$0</div><div class="stat-sub">0% bracket advantage</div></div>
    <div class="stat-box"><div class="stat-label">Annual ETF Fees</div><div class="stat-val red">~$25/yr</div><div class="stat-sub">grows with balance</div></div>
    <div class="stat-box"><div class="stat-label">Biggest Fee</div><div class="stat-val red">TQQQ</div><div class="stat-sub">0.88% · 4× others combined</div></div>
    <div class="stat-box"><div class="stat-label">ET Tax Warning</div><div class="stat-val amber">K-1 Form</div><div class="stat-sub">MLP · complex taxes</div></div>
    <div class="stat-box"><div class="stat-label">DOGE Loss Harvest</div><div class="stat-val amber">−$40</div><div class="stat-sub">Could offset future gains</div></div>
    <div class="stat-box"><div class="stat-label">30yr Fee Drag (8%)</div><div class="stat-val red">~$50k</div><div class="stat-sub">Cost of expense ratios</div></div>
  </div>

  <div class="tbl-wrap" style="margin-bottom:16px;">
    <table>
      <thead><tr><th>Holding</th><th>Account</th><th>Div Yield</th><th>Est. Ann. Div</th><th>Tax Rate</th><th>Tax Owed/yr</th><th>Cap Gains Rate</th><th>Notes</th></tr></thead>
      <tbody>
        <tr><td class="blue">SPY</td><td class="muted">Taxable</td><td>1.1%</td><td>~$37</td><td class="green">0%</td><td class="green">$0</td><td class="green">0% LT</td><td style="text-align:left;color:var(--muted);font-size:10px;">Qualified div · held 1yr+ = 0%</td></tr>
        <tr><td class="green">SCHD</td><td class="muted">Taxable</td><td>3.4%</td><td>~$57</td><td class="green">0%</td><td class="green">$0</td><td class="green">0% LT</td><td style="text-align:left;color:var(--muted);font-size:10px;">Best dividend ETF for tax efficiency</td></tr>
        <tr><td class="amber">KDP</td><td class="muted">Taxable</td><td>3.4%</td><td>~$18</td><td class="green">0%</td><td class="green">$0</td><td class="green">0% LT</td><td style="text-align:left;color:var(--muted);font-size:10px;">Qualified div</td></tr>
        <tr><td class="red">TQQQ</td><td class="muted">Taxable</td><td>0%</td><td>$0</td><td class="muted">N/A</td><td class="green">$0 divs</td><td class="amber">10-12% if sold &lt;1yr</td><td style="text-align:left;color:var(--amber);font-size:10px;">⚠️ Hold 1yr+ for 0% cap gains rate</td></tr>
        <tr><td class="orange">ET</td><td class="muted">Taxable</td><td>7.8%</td><td>~$12</td><td class="amber">Complicated</td><td class="amber">K-1 form</td><td class="amber">MLP rules apply</td><td style="text-align:left;color:var(--red);font-size:10px;">⚠️ K-1 tax form · state filings · talk to a CPA</td></tr>
        <tr><td class="purple">BTC</td><td class="muted">Taxable</td><td>0%</td><td>$0</td><td class="muted">N/A</td><td class="green">$0</td><td class="amber">0% LT if held 1yr+</td><td style="text-align:left;color:var(--muted);font-size:10px;">Currently at loss · hold for LT rate</td></tr>
        <tr><td class="red">DOGE</td><td class="muted">Taxable</td><td>0%</td><td>$0</td><td class="muted">N/A</td><td class="green">$0</td><td class="amber">Harvestable loss</td><td style="text-align:left;color:var(--amber);font-size:10px;">−$40 loss · sell to harvest · buyback after 30 days</td></tr>
        <tr style="background:rgba(13,255,140,0.03)"><td class="pink">AVUV</td><td class="green">Roth IRA</td><td>1.5%</td><td>~$27</td><td class="green">0% forever</td><td class="green">$0</td><td class="green">0% forever</td><td style="text-align:left;color:var(--green);font-size:10px;">✅ Tax-free growth + withdrawals</td></tr>
        <tr style="background:rgba(13,255,140,0.03)"><td class="purple">JEPI</td><td class="green">Roth IRA</td><td>8.2%</td><td>~$149</td><td class="green">0% forever</td><td class="green">$0</td><td class="green">0% forever</td><td style="text-align:left;color:var(--green);font-size:10px;">✅ Perfect placement — 8% yield tax-free</td></tr>
        <tr style="background:rgba(13,255,140,0.03)"><td class="teal">VXUS</td><td class="green">Roth IRA</td><td>3.2%</td><td>~$63</td><td class="green">0% forever</td><td class="green">$0</td><td class="green">0% forever</td><td style="text-align:left;color:var(--green);font-size:10px;">✅ Intl divs normally face foreign tax — shielded here</td></tr>
        <tr style="background:rgba(13,255,140,0.03)"><td class="blue">IBM</td><td class="green">Roth IRA</td><td>2.9%</td><td>~$37</td><td class="green">0% forever</td><td class="green">$0</td><td class="green">0% forever</td><td style="text-align:left;color:var(--green);font-size:10px;">✅ Any recovery gain also tax-free</td></tr>
      </tbody>
    </table>
  </div>

  <div class="tbl-wrap">
    <table>
      <thead><tr><th>ETF</th><th>Exp. Ratio</th><th>Annual Cost Now</th><th>At 10yr (~$60k)</th><th>At 20yr (~$200k)</th><th>At 30yr (~$600k)</th><th>Leverage</th><th>Account</th></tr></thead>
      <tbody>
        <tr><td class="blue">SPY</td><td>0.09%</td><td class="green">~$3/yr</td><td class="amber">~$54/yr</td><td class="amber">~$180/yr</td><td class="red">~$540/yr</td><td>1×</td><td class="muted">Taxable</td></tr>
        <tr><td class="green">SCHD</td><td>0.06%</td><td class="green">~$1/yr</td><td class="amber">~$36/yr</td><td class="amber">~$120/yr</td><td class="red">~$360/yr</td><td>1×</td><td class="muted">Taxable</td></tr>
        <tr><td class="red">TQQQ</td><td>0.88%</td><td class="red">~$8/yr</td><td class="red">~$528/yr</td><td class="red">~$1,760/yr</td><td class="red">~$5,280/yr</td><td style="color:var(--red);font-weight:700">3× Daily</td><td class="muted">Taxable</td></tr>
        <tr><td class="purple">JEPI</td><td>0.35%</td><td class="amber">~$6/yr</td><td class="amber">~$210/yr</td><td class="red">~$700/yr</td><td class="red">~$2,100/yr</td><td>1×</td><td class="green">Roth IRA</td></tr>
        <tr><td class="pink">AVUV</td><td>0.25%</td><td class="amber">~$5/yr</td><td class="amber">~$150/yr</td><td class="red">~$500/yr</td><td class="red">~$1,500/yr</td><td>1×</td><td class="green">Roth IRA</td></tr>
        <tr><td class="teal">VXUS</td><td>0.07%</td><td class="green">~$1/yr</td><td class="amber">~$42/yr</td><td class="amber">~$140/yr</td><td class="red">~$420/yr</td><td>1×</td><td class="green">Roth IRA</td></tr>
      </tbody>
      <tfoot><tr><td>TOTAL</td><td>avg ~0.22%</td><td class="amber">~$24/yr</td><td class="red">~$1,020/yr</td><td class="red">~$3,400/yr</td><td class="red">~$10,200/yr</td><td>—</td><td>—</td></tr></tfoot>
    </table>
  </div>
`;
