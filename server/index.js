const express = require('express');
const config = require('./config');
const db = require('./db/connection');
const { computePositions } = require('./lib/positions');

const app = express();

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Phase 5
app.get('/api/accounts', (req, res) => {
  res.json(db.prepare('SELECT id, name, type FROM accounts ORDER BY type').all());
});

// Phase 5. ?account=taxable|roth and ?symbol=SPY filter like
// /api/transactions; positions with quantity 0 (fully sold) are
// excluded unless ?closed=true.
app.get('/api/holdings', (req, res) => {
  const { account, symbol, closed } = req.query;
  let rows = computePositions(db);

  if (account) rows = rows.filter((p) => p.account_type === account);
  if (symbol) rows = rows.filter((p) => p.symbol === symbol.toUpperCase());
  if (closed !== 'true') rows = rows.filter((p) => Math.abs(p.quantity) > 1e-6);

  res.json(rows);
});

// Phase 5. ?symbol=SPY (optionally with ?from=YYYY-MM-DD&?to=YYYY-MM-DD)
// returns that security's full history; with no symbol, returns the
// latest snapshot per security. price_history is only populated once
// Phase 6/9 wire up live fetching, so this returns [] until then.
app.get('/api/prices', (req, res) => {
  const { symbol, from, to } = req.query;

  if (symbol) {
    let sql = `
      SELECT s.symbol, p.price, p.as_of, p.source
      FROM price_history p
      JOIN securities s ON s.id = p.security_id
      WHERE s.symbol = ?
    `;
    const params = [symbol.toUpperCase()];
    if (from) {
      sql += ' AND p.as_of >= ?';
      params.push(from);
    }
    if (to) {
      sql += ' AND p.as_of <= ?';
      params.push(to);
    }
    sql += ' ORDER BY p.as_of ASC';
    return res.json(db.prepare(sql).all(...params));
  }

  const rows = db.prepare(`
    SELECT s.symbol, p.price, p.as_of, p.source
    FROM price_history p
    JOIN securities s ON s.id = p.security_id
    WHERE p.as_of = (SELECT MAX(p2.as_of) FROM price_history p2 WHERE p2.security_id = p.security_id)
    ORDER BY s.symbol
  `).all();
  res.json(rows);
});

// Phase 5. ?active=true|false filters; omit to return every row.
app.get('/api/recurring', (req, res) => {
  const { active } = req.query;

  let sql = `
    SELECT r.id, a.type AS account, s.symbol, r.amount_usd, r.frequency, r.active, r.updated_at
    FROM recurring_config r
    JOIN accounts a ON a.id = r.account_id
    JOIN securities s ON s.id = r.security_id
    WHERE 1 = 1
  `;
  const params = [];
  if (active !== undefined) {
    sql += ' AND r.active = ?';
    params.push(active === 'true' || active === '1' ? 1 : 0);
  }
  sql += ' ORDER BY s.symbol';

  res.json(db.prepare(sql).all(...params));
});

// First working endpoint (Phase 3). Optional ?account=taxable|roth
// and ?symbol=SPY filters, newest first.
app.get('/api/transactions', (req, res) => {
  const { account, symbol } = req.query;

  let sql = `
    SELECT t.id, a.name AS account, a.type AS account_type, s.symbol,
           t.type, t.quantity, t.price, t.fee, t.amount, t.executed_at,
           t.is_synthetic, t.description
    FROM transactions t
    JOIN accounts a ON a.id = t.account_id
    LEFT JOIN securities s ON s.id = t.security_id
    WHERE 1 = 1
  `;
  const params = [];

  if (account) {
    sql += ' AND a.type = ?';
    params.push(account);
  }
  if (symbol) {
    sql += ' AND s.symbol = ?';
    params.push(symbol.toUpperCase());
  }

  sql += ' ORDER BY t.executed_at DESC, t.id DESC';

  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
});
