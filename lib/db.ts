import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

neonConfig.fetchConnectionCache = true

declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof createDrizzle> | undefined
}

function createDrizzle() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not configured')
  const sql = neon(process.env.DATABASE_URL)
  return drizzle(sql, { schema })
}

export function getDb() {
  if (!global.__db) {
    global.__db = createDrizzle()
  }
  return global.__db
}
