import fs from "node:fs";
import path from "node:path";
import { DatabaseSync, type StatementSync } from "node:sqlite";

const globalForDb = globalThis as unknown as { finzDb?: DatabaseSync };

export function getDb() {
  if (!globalForDb.finzDb) {
    const directory = path.join(process.cwd(), "data");
    fs.mkdirSync(directory, { recursive: true });
    const db = new DatabaseSync(path.join(directory, "finz.db"));
    db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        name TEXT NOT NULL,
        take_home_cents INTEGER NOT NULL,
        cadence TEXT NOT NULL,
        risk TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS dreams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        target_cents INTEGER NOT NULL,
        why TEXT NOT NULL,
        timeline TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount_cents INTEGER NOT NULL,
        direction TEXT NOT NULL,
        label TEXT NOT NULL,
        emotion TEXT NOT NULL,
        note TEXT NOT NULL,
        raw_note TEXT,
        created_at TEXT NOT NULL
      );
    `);
    globalForDb.finzDb = db;
  }
  return globalForDb.finzDb;
}

export function withTransaction<T>(fn: (db: DatabaseSync) => T): T {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const result = fn(db);
    db.exec("COMMIT");
    return result;
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* the original error is the one that matters */
    }
    throw error;
  }
}

export type { StatementSync };
