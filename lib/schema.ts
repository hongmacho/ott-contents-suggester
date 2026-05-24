import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at').notNull(),
})

export const watchedContents = sqliteTable('watched_contents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').notNull(),
  contentId: integer('content_id').notNull(),
  contentType: text('content_type').notNull(),
  createdAt: integer('created_at').notNull(),
})

export const preferences = sqliteTable('preferences', {
  sessionId: text('session_id').primaryKey(),
  ottPlatforms: text('ott_platforms').notNull().default('[]'),
  yearFrom: integer('year_from'),
  yearTo: integer('year_to'),
  updatedAt: integer('updated_at').notNull(),
})
