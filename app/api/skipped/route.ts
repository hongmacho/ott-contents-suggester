import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateSession } from '@/lib/session'
import { getDb } from '@/lib/db'
import { skippedContents } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function GET() {
  try {
    const { sessionId } = await getOrCreateSession()
    const db = getDb()

    const skipped = db
      .select({
        contentId: skippedContents.contentId,
        contentType: skippedContents.contentType,
        title: skippedContents.title,
        posterPath: skippedContents.posterPath,
      })
      .from(skippedContents)
      .where(eq(skippedContents.sessionId, sessionId))
      .all()

    return NextResponse.json({ success: true, data: skipped })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentId, contentType, title, posterPath } = body

    if (!contentId || !contentType) {
      return NextResponse.json({ success: false, error: '필수 파라미터 누락' }, { status: 400 })
    }

    const { sessionId } = await getOrCreateSession()
    const db = getDb()

    db.insert(skippedContents)
      .values({
        sessionId,
        contentId: Number(contentId),
        contentType: String(contentType),
        title: String(title ?? ''),
        posterPath: posterPath ? String(posterPath) : null,
        createdAt: Date.now(),
      })
      .onConflictDoNothing()
      .run()

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const contentId = parseInt(searchParams.get('contentId') ?? '0')
    const contentType = searchParams.get('contentType') ?? ''

    if (!contentId || !contentType) {
      return NextResponse.json({ success: false, error: '필수 파라미터 누락' }, { status: 400 })
    }

    const { sessionId } = await getOrCreateSession()
    const db = getDb()

    db.delete(skippedContents)
      .where(
        and(
          eq(skippedContents.sessionId, sessionId),
          eq(skippedContents.contentId, contentId),
          eq(skippedContents.contentType, contentType)
        )
      )
      .run()

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
