/* ══════════════════════════════════════════
   CHARTS — Reusable Chart Builders
   ══════════════════════════════════════════ */

Chart.defaults.color       = '#5a5a7a';
Chart.defaults.borderColor = '#222232';
Chart.defaults.font.family = 'Figtree';

let _chartInstances = {};

/** Destroy and recreate a chart safely */
function makeChart(id, config) {
  if (_chartInstances[id]) _chartInstances[id].destroy();
  const ctx = document.getElementById(id);
  if (!ctx) return null;
  _chartInstances[id] = new Chart(ctx.getContext('2d'), config);
  return _chartInstances[id];
}

/** P&L bar chart */
function buildPLChart(canvasId, holdings) {
  const labels = holdings.map(h => h.sym);
  const values = holdings.map(h => {
    const price = (liveData[h.sym]?.c || h.seedPrice);
    const qty   = h.shares || h.coins;
    return parseFloat(((price * qty) - (h.avgCost * qty)).toFixed(2));
  });

  return makeChart(canvasId, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: values.map(v => v >= 0 ? 'rgba(13,255,140,0.7)' : 'rgba(255,61,90,0.7)'),
        borderColor:     values.map(v => v >= 0 ? '#0dff8c' : '#ff3d5a'),
        borderWidth: 1, borderRadius: 5, borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { ...chartTooltip(), callbacks: { label: c => ` ${c.raw >= 0 ? '+' : ''}$${c.raw.toFixed(2)}` }},
      },
      scales: chartScales(v => `$${v}`),
    }
  });
}

/** Dividend income horizontal bar */
function buildDivChart(canvasId) {
  const all = [
    { label:'JEPI (IRA)', val:149, color:'#b57bff' },
    { label:'VXUS (IRA)', val:63,  color:'#00e5cc' },
    { label:'IBM (IRA)',  val:37,  color:'#3d9eff' },
    { label:'AVUV (IRA)', val:27,  color:'#ff6eb4' },
    { label:'SCHD',       val:57,  color:'#0dff8c' },
    { label:'SPY',        val:37,  color:'#3d9effbb' },
    { label:'KDP',        val:18,  color:'#ffcc00' },
    { label:'ET',         val:12,  color:'#ff8c42' },
  ];

  return makeChart(canvasId, {
    type: 'bar',
    data: {
      labels: all.map(i => i.label),
      datasets: [{
        data: all.map(i => i.val),
        backgroundColor: all.map(i => i.color + 'bb'),
        borderColor:     all.map(i => i.color),
        borderWidth: 1, borderRadius: 5, borderSkipped: false,
      }]
    },
    options: {
      indexAxis: 'y', responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { ...chartTooltip(), callbacks: { label: c => ` ~$${c.raw}/yr` }},
      },
      scales: {
        x: { grid: { color: 'rgba(34,34,50,0.8)' }, ticks: { color: '#5a5a7a', font: { size: 10 }, callback: v => `$${v}` }},
        y: { grid: { display: false }, ticks: { color: '#9090b0', font: { size: 10 }}},
      }
    }
  });
}

/** Allocation donut */
function buildAllocChart(canvasId) {
  const all = [...TAXABLE, ...ROTH, ...TAXABLE_CRYPTO];
  const labels = all.map(h => h.sym);
  const values = all.map(h => {
    const price = liveData[h.sym]?.c || h.seedPrice;
    const qty   = h.shares || h.coins;
    return Math.round(price * qty);
  });
  const total = values.reduce((a, b) => a + b, 0);

  return makeChart(canvasId, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: all.map(h => h.color),
        borderColor: '#060608', borderWidth: 3, hoverOffset: 8,
      }]
    },
    options: {
      cutout: '58%',
      plugins: {
        legend: { display: true, position: 'right', labels: { color: '#9090b0', font: { size: 10 }, boxWidth: 10, padding: 6 }},
        tooltip: { ...chartTooltip(), callbacks: { label: c => ` ${c.label}: $${c.raw.toLocaleString()} (${((c.raw/total)*100).toFixed(1)}%)` }},
      }
    }
  });
}

/** DCA distribution donut */
function buildDCAChart(canvasId) {
  const items = [
    { label:'AVUV (IRA)', val:7.00,  color:'#ff6eb4' },
    { label:'VXUS (IRA)', val:5.80,  color:'#00e5cc' },
    { label:'JEPI (IRA)', val:4.75,  color:'#b57bff' },
    { label:'SPY',        val:2.00,  color:'#3d9eff' },
    { label:'ET',         val:2.00,  color:'#ff8c42' },
    { label:'SCHD',       val:2.10,  color:'#0dff8c' },
    { label:'KDP',        val:1.25,  color:'#ffcc00' },
    { label:'BTC',        val:1.00,  color:'#b57bffbb'},
  ];

  return makeChart(canvasId, {
    type: 'doughnut',
    data: {
      labels: items.map(i => i.label),
      datasets: [{
        data: items.map(i => i.val),
        backgroundColor: items.map(i => i.color + 'bb'),
        borderColor:     items.map(i => i.color),
        borderWidth: 2, hoverOffset: 8,
      }]
    },
    options: {
      cutout: '58%',
      plugins: {
        legend: { display: true, position: 'right', labels: { color: '#9090b0', font: { size: 10 }, boxWidth: 10, padding: 6 }},
        tooltip: { ...chartTooltip(), callbacks: { label: c => ` $${c.raw}/day · $${(c.raw*365).toFixed(0)}/yr` }},
      }
    }
  });
}

/** Projection line chart (all 3 scenarios) */
function buildProjectionChart(canvasId, startVal, years) {
  const ann = totalAnnualDCA();
  const g8  = projectPortfolio(startVal, ann, 8, years);
  const g6  = projectPortfolio(startVal, ann, 6, years);
  const g4  = projectPortfolio(startVal, ann, 4, years);
  const dep = projectDepositsOnly(startVal, ann, years);
  const labels = Array.from({ length: years }, (_, i) => 2026 + i + 1);

  const ctx  = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;
  const gG   = ctx.createLinearGradient(0, 0, 0, 420);
  gG.addColorStop(0, 'rgba(13,255,140,0.18)'); gG.addColorStop(1, 'rgba(13,255,140,0)');
  const gB   = ctx.createLinearGradient(0, 0, 0, 420);
  gB.addColorStop(0, 'rgba(61,158,255,0.08)');  gB.addColorStop(1, 'rgba(61,158,255,0)');

  return makeChart(canvasId, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label:'8% Historical', data:g8, borderColor:'#0dff8c', backgroundColor:gG, borderWidth:3, pointRadius:0, pointHoverRadius:7, fill:true, tension:0.4 },
        { label:'6% Below avg',  data:g6, borderColor:'#3d9eff', backgroundColor:'transparent', borderWidth:2, borderDash:[8,4], pointRadius:0, pointHoverRadius:6, fill:false, tension:0.4 },
        { label:'4% Worst case', data:g4, borderColor:'#ff3d5a', backgroundColor:'transparent', borderWidth:2, borderDash:[4,3], pointRadius:0, pointHoverRadius:5, fill:false, tension:0.4 },
        { label:'Deposits only', data:dep,borderColor:'#5a5a7a', backgroundColor:gB, borderWidth:1.5, borderDash:[3,5], pointRadius:0, pointHoverRadius:4, fill:true, tension:0.4 },
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: true, position: 'top', align: 'end', labels: { color: '#9090b0', font: { size: 10 }, boxWidth: 14, usePointStyle: true, pointStyle: 'line' }},
        tooltip: { ...chartTooltip(), callbacks: {
          title: c => `Year ${c[0].label}`,
          label: c => { const v = c.raw; return ` ${c.dataset.label}: ${v >= 1e6 ? '$' + (v/1e6).toFixed(2) + 'M' : v >= 1e3 ? '$' + (v/1e3).toFixed(0) + 'k' : '$' + v}`; }
        }},
      },
      scales: chartScales(),
    }
  });
}
