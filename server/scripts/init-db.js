// Phase 2: create the SQLite DB and all tables from schema.sql.
// Safe to re-run - every statement in schema.sql is CREATE TABLE IF NOT EXISTS.

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', 'db', 'portfolio.db');
const SCHEMA_PATH = path.join(__dirname, '..', 'db', 'schema.sql');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
  .all()
  .map((r) => r.name);

console.log(`DB initialized at ${DB_PATH}`);
console.log('Tables:', tables.join(', '));

db.close();
