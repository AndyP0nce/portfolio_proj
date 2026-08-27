// Phase 8: tax + expense-ratio analysis, replacing the fully
// hardcoded tables in pages/analysis/analysis.js with numbers derived
// from real positions (positions.js) and real dividend history
// (dividends.js).
//
// Tax-rate assumption matches what that page already assumed: the
// filer is under the ~$47,025 0% bracket for qualified dividends and
// long-term capital gains, and Roth IRA dividends/gains are always
// tax-free. This does NOT model non-qualified dividends, short-term
// gains, or MLP K-1 complexity - ET (an MLP) is flagged rather than
// given a computed number, since that genuinely needs a CPA.

const MLP_SYMBOLS = new Set(['ET']);

function analyzeTax(positions, dividendEstimates, pricesBySymbol = {}) {
  const divByKey = new Map(
    dividendEstimates.map((d) => [`${d.account_type}:${d.symbol}`, d.estimated_annual_dividend])
  );

  return positions
    .filter((p) => Math.abs(p.quantity) > 1e-6)
    .map((p) => {
      const estAnnualDividend = divByKey.get(`${p.account_type}:${p.symbol}`) || 0;
      const taxFree = p.account_type === 'roth';
      const isMlp = MLP_SYMBOLS.has(p.symbol);

      // Fee drag applies to current market value, not cost basis - use
      // a live quote when one was passed in, else fall back to cost
      // basis (same "best available" fallback pattern positions.js
      // uses for private/illiquid holdings with no live quote).
      const price = pricesBySymbol[p.symbol];
      const marketValue = price != null ? price * p.quantity : p.cost_basis;
      const annualFeeDrag = p.expense_ratio != null ? round(marketValue * (p.expense_ratio / 100)) : null;

      return {
        account_type: p.account_type,
        symbol: p.symbol,
        security_name: p.security_name,
        market_value: round(marketValue),
        estimated_annual_dividend: round(estAnnualDividend),
        dividend_tax_owed: taxFree || !isMlp ? 0 : null,
        tax_free: taxFree,
        mlp_k1: isMlp,
        expense_ratio: p.expense_ratio,
        annual_fee_drag: annualFeeDrag,
      };
    })
    .sort((a, b) => a.account_type.localeCompare(b.account_type) || a.symbol.localeCompare(b.symbol));
}

function round(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { analyzeTax };
