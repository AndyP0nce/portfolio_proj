-- Portfolio dashboard schema (Phase 2)
-- Local-only SQLite DB. Source of truth is `transactions`; positions,
-- cost basis, and P&L are all derived from it (see Phase 4).

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS accounts (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('taxable', 'roth'))
);

CREATE TABLE IF NOT EXISTS securities (
  id             INTEGER PRIMARY KEY,
  symbol         TEXT NOT NULL UNIQUE,
  name           TEXT,
  -- 'private' covers illiquid/non-quotable holdings (e.g. SPCX) that
  -- Finnhub/CoinGecko can't price live.
  type           TEXT NOT NULL CHECK (type IN ('stock', 'etf', 'crypto', 'private')),
  expense_ratio  REAL,
  sector         TEXT
);

-- type:
--   buy        - opens/adds to a position (includes DRIP reinvestment buys)
--   sell       - reduces/closes a position
--   dividend   - cash dividend paid out (not reinvested); quantity = shares
--                held at record date, price = per-share dividend amount
--   deposit    - cash in with no security (ACH, instant transfer, IRA
--                contribution)
--   interest   - cash interest earned on uninvested balance, or IRA match
--   adjustment - other cash-only statement lines that don't fit above
--                (e.g. Robinhood's "Event Contracts Inter-Entity Cash
--                Transfer" sweeps)
-- security_id is NULL for cash-only rows (deposit/interest/adjustment).
-- amount is the signed net cash effect of the row, taken directly from
-- the statement "Amount" column - the ground-truth reconciliation value
-- even when quantity/price are also present or derived.
CREATE TABLE IF NOT EXISTS transactions (
  id            INTEGER PRIMARY KEY,
  account_id    INTEGER NOT NULL REFERENCES accounts(id),
  security_id   INTEGER REFERENCES securities(id),
  type          TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'dividend', 'deposit', 'interest', 'adjustment')),
  quantity      REAL,
  price         REAL,
  fee           REAL NOT NULL DEFAULT 0,
  amount        REAL NOT NULL,
  executed_at   TEXT NOT NULL,
  is_synthetic  INTEGER NOT NULL DEFAULT 0 CHECK (is_synthetic IN (0, 1)),
  source        TEXT,
  description   TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transactions_account   ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_security  ON transactions(security_id);
CREATE INDEX IF NOT EXISTS idx_transactions_executed   ON transactions(executed_at);

CREATE TABLE IF NOT EXISTS price_history (
  id           INTEGER PRIMARY KEY,
  security_id  INTEGER NOT NULL REFERENCES securities(id),
  price        REAL NOT NULL,
  as_of        TEXT NOT NULL,
  source       TEXT,
  UNIQUE (security_id, as_of)
);

CREATE INDEX IF NOT EXISTS idx_price_history_security ON price_history(security_id, as_of);

-- Editable so DCA amounts can be changed without touching the DB
-- directly; the 10pm cron reads active rows from here each run.
CREATE TABLE IF NOT EXISTS recurring_config (
  id           INTEGER PRIMARY KEY,
  security_id  INTEGER NOT NULL REFERENCES securities(id),
  account_id   INTEGER NOT NULL REFERENCES accounts(id),
  amount_usd   REAL NOT NULL,
  frequency    TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily')),
  active       INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
