const express = require('express');
const config = require('./config');
const db = require('./db/connection');

const app = express();

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
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
