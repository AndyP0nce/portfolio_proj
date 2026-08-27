// Phase 4: cross-check computePositions() against the hand-maintained
// data/holdings.js numbers it's meant to replace. holdings.js is a
// plain <script> (no module.exports), so it's evaluated in a vm
// sandbox to pull out TAXABLE / ROTH rather than parsed by hand.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const db = require('../db/connection');
const { computePositions } = require('../lib/positions');

const HOLDINGS_PATH = path.join(__dirname, '..', '..', 'data', 'holdings.js');
const QTY_TOLERANCE = 0.01;      // shares
const COST_TOLERANCE_PCT = 0.01; // 1%

function loadHoldings() {
  // holdings.js declares TAXABLE/ROTH with `const`, which - in any JS
  // realm, not just vm - never becomes an enumerable property of the
  // global object. Appending an explicit assignment in the same
  // script string keeps it in the same top-level lexical scope, so it
  // can still see those bindings and hang them off the sandbox.
  const code = fs.readFileSync(HOLDINGS_PATH, 'utf8');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(`${code}\nthis.__RESULT__ = { TAXABLE, ROTH };`, sandbox, { filename: HOLDINGS_PATH });
  return sandbox.__RESULT__;
}

function fmt(n, digits = 4) {
  return n == null ? 'null' : n.toFixed(digits);
}

function main() {
  const { TAXABLE, ROTH } = loadHoldings();
  const expected = [
    ...TAXABLE.map((h) => ({ account_type: 'taxable', symbol: h.sym, shares: h.shares, avgCost: h.avgCost })),
    ...ROTH.map((h) => ({ account_type: 'roth', symbol: h.sym, shares: h.shares, avgCost: h.avgCost })),
  ];

  const computed = computePositions(db);
  const computedByKey = new Map(computed.map((p) => [`${p.account_type}:${p.symbol}`, p]));
  const matchedKeys = new Set();

  let mismatches = 0;
  console.log('symbol   account   expected qty   computed qty   expected avg   computed avg   status');
  console.log('-'.repeat(95));

  for (const exp of expected) {
    const key = `${exp.account_type}:${exp.symbol}`;
    const comp = computedByKey.get(key);
    matchedKeys.add(key);

    if (!comp) {
      mismatches += 1;
      console.log(`${exp.symbol.padEnd(8)} ${exp.account_type.padEnd(9)} ${fmt(exp.shares).padEnd(14)} ${'—'.padEnd(14)} ${fmt(exp.avgCost).padEnd(14)} ${'—'.padEnd(14)} MISSING from transactions`);
      continue;
    }

    const qtyOff = Math.abs(comp.quantity - exp.shares) > QTY_TOLERANCE;
    const costOff = exp.avgCost > 0
      && Math.abs(comp.avg_cost - exp.avgCost) / exp.avgCost > COST_TOLERANCE_PCT;

    let status = 'ok';
    if (comp.has_unknown_basis) status = 'ok (unknown-basis lot)';
    if (qtyOff || costOff) {
      status = qtyOff && costOff ? 'QTY + COST MISMATCH' : qtyOff ? 'QTY MISMATCH' : 'COST MISMATCH';
      mismatches += 1;
    }

    console.log(
      `${exp.symbol.padEnd(8)} ${exp.account_type.padEnd(9)} ${fmt(exp.shares).padEnd(14)} ${fmt(comp.quantity).padEnd(14)} ${fmt(exp.avgCost).padEnd(14)} ${fmt(comp.avg_cost).padEnd(14)} ${status}`
    );
  }

  const extra = computed.filter((p) => !matchedKeys.has(`${p.account_type}:${p.symbol}`) && p.quantity !== 0);
  if (extra.length) {
    console.log('\nPositions derived from transactions but not in holdings.js:');
    for (const p of extra) {
      console.log(`  ${p.symbol.padEnd(8)} ${p.account_type.padEnd(9)} qty=${fmt(p.quantity)} avgCost=${fmt(p.avg_cost)}${p.has_unknown_basis ? ' (unknown-basis lot)' : ''}`);
    }
  }

  console.log(`\n${mismatches} mismatch(es), ${extra.length} untracked position(s).`);
  if (mismatches > 0) process.exitCode = 1;
}

main();
