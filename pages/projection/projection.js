/* ══════════════════════════════════════════
   PROJECTION PAGE
   ══════════════════════════════════════════ */
document.getElementById('pageRoot').innerHTML = `
  <div style="font-family:var(--font-title);font-size:30px;letter-spacing:1px;margin-bottom:6px;">
    30-YEAR <span style="color:var(--green)">PROJECTION</span>
  </div>
  <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);margin-bottom:20px;">// $25.90/day DCA · 3% Roth match · 1% Taxable match · Adjust inputs live</div>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:10px;margin-bottom:20px;">
    <div class="stat-box"><div class="stat-label">Starting Value</div><div style="display:flex;align-items:center;gap:4px;"><span style="font-family:var(--font-title);font-size:17px;color:var(--muted)">$</span><input type="number" id="startVal" value="15310" style="background:transparent;border:none;outline:none;color:var(--text);font-family:var(--font-title);font-size:20px;width:100%;"></div></div>
    <div class="stat-box"><div class="stat-label">Roth IRA Daily</div><div style="display:flex;align-items:center;gap:4px;"><span style="font-family:var(--font-title);font-size:17px;color:var(--muted)">$</span><input type="number" id="iraDaily" value="17.55" style="background:transparent;border:none;outline:none;color:var(--text);font-family:var(--font-title);font-size:20px;width:100%;"><span style="font-family:var(--font-mono);font-size:9px;color:var(--muted);white-space:nowrap;">/day 3%</span></div></div>
    <div class="stat-box"><div class="stat-label">Taxable Daily</div><div style="display:flex;align-items:center;gap:4px;"><span style="font-family:var(--font-title);font-size:17px;color:var(--muted)">$</span><input type="number" id="taxDaily" value="8.35" style="background:transparent;border:none;outline:none;color:var(--text);font-family:var(--font-title);font-size:20px;width:100%;"><span style="font-family:var(--font-mono);font-size:9px;color:var(--muted);white-space:nowrap;">/day 1%</span></div></div>
    <div class="stat-box"><div class="stat-label">Years</div><div style="display:flex;align-items:center;gap:4px;"><input type="number" id="projYears" value="30" min="5" max="50" style="background:transparent;border:none;outline:none;color:var(--text);font-family:var(--font-title);font-size:20px;width:100%;"><span style="font-family:var(--font-mono);font-size:9px;color:var(--muted);">yrs</span></div></div>
  </div>

  <div class="milestone-grid" id="milestones" style="margin-bottom:16px;"></div>

  <div class="chart-card">
    <div class="chart-title">Growth Over Time</div>
    <div class="chart-sub">HOVER FOR EXACT VALUES · ALL 3 SCENARIOS + DEPOSITS ONLY</div>
    <canvas id="projChart" height="300"></canvas>
    <div class="leg">
      <div class="leg-item" style="border-color:var(--green);color:var(--green)">8% Historical</div>
      <div class="leg-item" style="border-color:var(--blue);color:var(--blue)">6% Below avg</div>
      <div class="leg-item" style="border-color:var(--red);color:var(--red)">4% Worst case</div>
      <div class="leg-item" style="border-color:var(--muted)">Deposits only</div>
    </div>
  </div>
`;

function updateProjection() {
  const start = parseFloat(document.getElementById('startVal').value) || 15310;
  const iraD  = parseFloat(document.getElementById('iraDaily').value) || 17.55;
  const taxD  = parseFloat(document.getElementById('taxDaily').value) || 8.35;
  const years = parseInt(document.getElementById('projYears').value)  || 30;
  const ann   = (iraD * 365 * 1.03) + (taxD * 365 * 1.01);

  // Milestones
  const ms = [2026,2028,2030,2035,2040,2045,2050,2055];
  const g8 = projectPortfolio(start, ann, 8, years);
  const colors = ['#dde0f0','#3d9eff','#3d9eff','#0dff8c','#0dff8c','#b57bff','#b57bff','#ff6eb4'];
  document.getElementById('milestones').innerHTML = ms.map((yr,i) => {
    const idx = yr - 2027;
    const val = idx < 0 ? start : (idx < years ? g8[idx] : null);
    if (!val) return '';
    return `<div class="ms"><div class="ms-year">${yr}</div><div class="ms-val" style="color:${colors[i]}">${$short(val)}</div><div class="ms-sub">+${$short(ann*(idx+1))} deposited</div></div>`;
  }).join('');

  buildProjectionChart('projChart', start, years);
}

['startVal','iraDaily','taxDaily','projYears'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', updateProjection);
});

updateProjection();
