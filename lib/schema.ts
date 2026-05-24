import { pgTable, text, integer, serial, boolean, timestamp, primaryKey } from 'drizzle-orm/pg-core'
import type { AdapterAccountType } from 'next-auth/adapters'

// Auth.js v5 required tables
export const users = pgTable('user', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
})

export const accounts = pgTable('account', {
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').$type<AdapterAccountType>().notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => ({
  pk: primaryKey({ columns: [table.provider, table.providerAccountId] }),
}))

export const authSessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.identifier, table.token] }),
}))

// App tables — sessionId 컬럼에 Auth.js userId 저장
export const watchedContents = pgTable('watched_contents', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  contentId: integer('content_id').notNull(),
  contentType: text('content_type').notNull(),
  title: text('title').notNull().default(''),
  posterPath: text('poster_path'),
  createdAt: integer('created_at').notNull(),
})

export const skippedContents = pgTable('skipped_contents', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  contentId: integer('content_id').notNull(),
  contentType: text('content_type').notNull(),
  title: text('title').notNull().default(''),
  posterPath: text('poster_path'),
  createdAt: integer('created_at').notNull(),
})

export const preferences = pgTable('preferences', {
  sessionId: text('session_id').primaryKey(),
  ottPlatforms: text('ott_platforms').notNull().default('[]'),
  yearFrom: integer('year_from'),
  yearTo: integer('year_to'),
  originLanguages: text('origin_languages').default('[]'),
  excludeAnimation: boolean('exclude_animation').notNull().default(false),
  updatedAt: integer('updated_at').notNull(),
})
