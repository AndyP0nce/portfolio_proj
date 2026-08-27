// Phase 4: derive open positions, cost basis, and realized P&L purely
// from `transactions` - no numbers are stored, everything here is a
// fold over buy/sell rows ordered by execution date.
//
// Cost basis method: weighted average cost (matches how avgCost is
// tracked in data/holdings.js today - not FIFO lots).
//
// Synthetic opening lots (seed.js) carry price = null because their
// real cost basis predates the available statements. Their shares
// still count toward quantity (so later sells don't go negative), but
// they're excluded from the cost-basis average since there's nothing
// real to average in. Any position touched by one of these is flagged
// has_unknown_basis so callers don't mistake the average for a
// complete cost basis.

function computePositions(db) {
  const rows = db.prepare(`
    SELECT t.account_id, a.name AS account, a.type AS account_type,
           t.security_id, s.symbol, s.name AS security_name, s.type AS security_type,
           s.expense_ratio, t.type, t.quantity, t.price, t.fee
    FROM transactions t
    JOIN accounts a ON a.id = t.account_id
    JOIN securities s ON s.id = t.security_id
    WHERE t.type IN ('buy', 'sell')
    ORDER BY t.executed_at ASC, t.id ASC
  `).all();

  const positions = new Map();

  for (const row of rows) {
    const key = `${row.account_id}:${row.security_id}`;
    if (!positions.has(key)) {
      positions.set(key, {
        account_id: row.account_id,
        account: row.account,
        account_type: row.account_type,
        security_id: row.security_id,
        symbol: row.symbol,
        security_name: row.security_name,
        security_type: row.security_type,
        expense_ratio: row.expense_ratio,
        quantity: 0,
        cost_basis: 0,
        cost_basis_quantity: 0,
        realized_pnl: 0,
        has_unknown_basis: false,
      });
    }
    const pos = positions.get(key);

    if (row.type === 'buy') {
      pos.quantity += row.quantity;
      if (row.price == null) {
        pos.has_unknown_basis = true;
      } else {
        pos.cost_basis += row.quantity * row.price + row.fee;
        pos.cost_basis_quantity += row.quantity;
      }
      continue;
    }

    // sell
    const avgCost = pos.cost_basis_quantity > 0 ? pos.cost_basis / pos.cost_basis_quantity : null;
    if (avgCost == null) {
      pos.has_unknown_basis = true;
    } else {
      pos.realized_pnl += row.quantity * (row.price - avgCost) - row.fee;
      pos.cost_basis -= row.quantity * avgCost;
      pos.cost_basis_quantity -= row.quantity;
      if (pos.cost_basis_quantity < 0) pos.cost_basis_quantity = 0;
      if (pos.cost_basis < 0) pos.cost_basis = 0;
    }
    pos.quantity -= row.quantity;
  }

  return [...positions.values()]
    .map((pos) => ({
      account: pos.account,
      account_type: pos.account_type,
      symbol: pos.symbol,
      security_name: pos.security_name,
      security_type: pos.security_type,
      expense_ratio: pos.expense_ratio,
      quantity: round(pos.quantity),
      avg_cost: pos.cost_basis_quantity > 0 ? round(pos.cost_basis / pos.cost_basis_quantity) : null,
      cost_basis: round(pos.cost_basis),
      realized_pnl: round(pos.realized_pnl),
      has_unknown_basis: pos.has_unknown_basis,
    }))
    .sort((a, b) => a.account.localeCompare(b.account) || a.symbol.localeCompare(b.symbol));
}

function round(n) {
  return Math.round(n * 1e6) / 1e6;
}

module.exports = { computePositions };
