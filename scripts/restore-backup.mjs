import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'

const sql = neon(process.env.DATABASE_URL)
const backup = JSON.parse(readFileSync('./data/excluded-backup.json', 'utf-8'))
const userId = 'd757a7a2-4c0d-466c-8829-f1f03d33b67b'

let watchedOk = 0
let skippedOk = 0

for (const w of backup.watched) {
  await sql`
    INSERT INTO watched_contents (session_id, content_id, content_type, title, poster_path, created_at)
    VALUES (${userId}, ${w.content_id}, ${w.content_type}, ${w.title}, ${w.poster_path}, ${Math.floor(w.created_at / 1000)})
    ON CONFLICT DO NOTHING
  `
  watchedOk++
}

for (const s of backup.skipped) {
  await sql`
    INSERT INTO skipped_contents (session_id, content_id, content_type, title, poster_path, created_at)
    VALUES (${userId}, ${s.content_id}, ${s.content_type}, ${s.title}, ${s.poster_path}, ${Math.floor(s.created_at / 1000)})
    ON CONFLICT DO NOTHING
  `
  skippedOk++
}

console.log(`watched 복원: ${watchedOk}개`)
console.log(`skipped 복원: ${skippedOk}개`)
