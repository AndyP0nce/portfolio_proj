// Phase 8: the same compounding math that used to live client-side in
// js/utils.js (projectPortfolio / projectDepositsOnly), moved here so
// it's the authoritative version. js/utils.js is left alone since the
// projection page isn't wired to fetch yet (it's an empty HTML shell -
// see pages/projection/), but this is now the version any future
// endpoint or job should call.

function projectGrowth(start, annualContribution, ratePercent, years) {
  let v = start;
  const out = [];
  for (let i = 0; i < years; i++) {
    v = v * (1 + ratePercent / 100) + annualContribution;
    out.push(Math.round(v));
  }
  return out;
}

function projectDepositsOnly(start, annualContribution, years) {
  return Array.from({ length: years }, (_, i) => Math.round(start + annualContribution * (i + 1)));
}

module.exports = { projectGrowth, projectDepositsOnly };
