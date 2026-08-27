/* ══════════════════════════════════════════
   UTILS — Formatting + Math Helpers
   ══════════════════════════════════════════ */

/** Format dollar value */
function $f(n, dec = 2) {
  const abs = Math.abs(n);
  if (abs >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (abs >= 1e3) return '$' + Math.round(n).toLocaleString('en-US');
  return '$' + abs.toFixed(dec);
}

/** Short format for large numbers */
function $short(n) {
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'k';
  return '$' + Math.abs(n).toFixed(0);
}

/** Format price with appropriate decimals */
function fmtPrice(p) {
  if (p >= 1000) return '$' + p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1)    return '$' + p.toFixed(2);
  return '$' + p.toFixed(6);
}

/** Positive sign string */
function pSign(n) { return n >= 0 ? '+' : ''; }

/** CSS class for positive/negative */
function pClass(n) { return n >= 0 ? 'green' : 'red'; }

/** Project portfolio value */
function projectPortfolio(start, annualContrib, ratePercent, years) {
  let v = start;
  return Array.from({ length: years }, () => {
    v = v * (1 + ratePercent / 100) + annualContrib;
    return Math.round(v);
  });
}

/** Deposits only (no growth) */
function projectDepositsOnly(start, annualContrib, years) {
  return Array.from({ length: years }, (_, i) => Math.round(start + annualContrib * (i + 1)));
}

/** Default Chart.js tooltip config */
function chartTooltip() {
  return {
    backgroundColor: '#0d0d12',
    borderColor:     '#2e2e45',
    borderWidth:     1,
    titleColor:      '#dde0f0',
    bodyColor:       '#9090b0',
    padding:         12,
    titleFont:       { family: 'Dela Gothic One', size: 13 },
    bodyFont:        { family: 'Martian Mono', size: 10 },
  };
}

/** Default Chart.js scales */
function chartScales(yTickFmt) {
  return {
    x: {
      grid:  { color: 'rgba(34,34,50,0.6)' },
      ticks: { color: '#5a5a7a', font: { size: 10 }, maxTicksLimit: 12 },
    },
    y: {
      grid:  { color: 'rgba(34,34,50,0.6)' },
      ticks: {
        color: '#5a5a7a', font: { size: 10 },
        callback: yTickFmt || (v => v >= 1e6 ? '$' + (v/1e6).toFixed(1) + 'M' : v >= 1e3 ? '$' + (v/1e3).toFixed(0) + 'k' : '$' + v),
      },
    },
  };
}
