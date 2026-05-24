import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import path from 'path'
import * as schema from './schema'

declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof createDrizzle> | undefined
}

function createDrizzle() {
  const dbPath = path.resolve(process.env.DATABASE_URL ?? './data/ott-contents.db')
  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS watched_contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      content_id INTEGER NOT NULL,
      content_type TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(session_id, content_id, content_type)
    );
    CREATE TABLE IF NOT EXISTS preferences (
      session_id TEXT PRIMARY KEY,
      ott_platforms TEXT NOT NULL DEFAULT '[]',
      year_from INTEGER,
      year_to INTEGER,
      korean_only INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );
  `)

  // migrate existing tables
  try { sqlite.exec(`ALTER TABLE preferences ADD COLUMN korean_only INTEGER NOT NULL DEFAULT 0`) } catch { /* already exists */ }

  return drizzle(sqlite, { schema })
}

export function getDb() {
  if (process.env.NODE_ENV === 'production') {
    return createDrizzle()
  }
  if (!global.__db) {
    global.__db = createDrizzle()
  }
  return global.__db
}
