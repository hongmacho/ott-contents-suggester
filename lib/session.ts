import { cookies } from 'next/headers'
import { randomUUID } from 'node:crypto'
import { getDb } from './db'
import { sessions } from './schema'
import { eq } from 'drizzle-orm'

const SESSION_COOKIE = 'hongcha_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export async function getOrCreateSession(): Promise<{ sessionId: string }> {
  const cookieStore = await cookies()
  const existingId = cookieStore.get(SESSION_COOKIE)?.value

  if (existingId) {
    const db = getDb()
    const session = db.select().from(sessions).where(eq(sessions.id, existingId)).get()
    if (session) return { sessionId: existingId }
  }

  const sessionId = randomUUID()
  const db = getDb()
  db.insert(sessions).values({ id: sessionId, createdAt: Date.now() }).run()

  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })

  return { sessionId }
}
