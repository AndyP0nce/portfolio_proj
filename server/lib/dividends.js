// Phase 8: dividend income estimates, derived from real dividend
// transactions instead of the hardcoded per-symbol yield percentages
// that used to live in pages/analysis/analysis.js.
//
// Estimate = total dividends received to date for that (account,
// security), annualized by its actual history span (today minus its
// first dividend date). A position with only 2 months of dividend
// history gets scaled up to a 12-month estimate rather than reported
// as its raw (understated) total - noisy for very short histories,
// but never fabricated from a static assumption.

function estimateDividends(db, { asOf } = {}) {
  const cutoff = asOf ? new Date(asOf) : new Date();

  const rows = db.prepare(`
    SELECT t.account_id, a.name AS account, a.type AS account_type,
           t.security_id, s.symbol, s.name AS security_name,
           t.amount, t.executed_at
    FROM transactions t
    JOIN accounts a ON a.id = t.account_id
    JOIN securities s ON s.id = t.security_id
    WHERE t.type = 'dividend'
    ORDER BY t.executed_at ASC
  `).all();

  const groups = new Map();
  for (const r of rows) {
    const key = `${r.account_id}:${r.security_id}`;
    if (!groups.has(key)) {
      groups.set(key, {
        account: r.account,
        account_type: r.account_type,
        symbol: r.symbol,
        security_name: r.security_name,
        firstDate: r.executed_at,
        total: 0,
      });
    }
    groups.get(key).total += r.amount;
  }

  return [...groups.values()]
    .map((g) => {
      const daysSpanned = Math.max(1, (cutoff - new Date(g.firstDate)) / 86400000);
      const annualized = g.total * (365 / daysSpanned);
      return {
        account: g.account,
        account_type: g.account_type,
        symbol: g.symbol,
        security_name: g.security_name,
        dividends_received_to_date: round(g.total),
        history_days: Math.round(daysSpanned),
        estimated_annual_dividend: round(annualized),
      };
    })
    .sort((a, b) => a.account.localeCompare(b.account) || a.symbol.localeCompare(b.symbol));
}

function round(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { estimateDividends };
