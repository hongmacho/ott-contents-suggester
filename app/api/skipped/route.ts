import { NextRequest, NextResponse } from 'next/server'
import { getRequiredUserId } from '@/lib/auth-session'
import { getDb } from '@/lib/db'
import { skippedContents } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function GET() {
  try {
    const userId = await getRequiredUserId()
    const db = getDb()

    const skipped = await db
      .select({
        contentId: skippedContents.contentId,
        contentType: skippedContents.contentType,
        title: skippedContents.title,
        posterPath: skippedContents.posterPath,
      })
      .from(skippedContents)
      .where(eq(skippedContents.sessionId, userId))

    return NextResponse.json({ success: true, data: skipped })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
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

    const userId = await getRequiredUserId()
    const db = getDb()

    await db
      .insert(skippedContents)
      .values({
        sessionId: userId,
        contentId: Number(contentId),
        contentType: String(contentType),
        title: String(title ?? ''),
        posterPath: posterPath ? String(posterPath) : null,
        createdAt: Math.floor(Date.now() / 1000),
      })
      .onConflictDoNothing()

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
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

    const userId = await getRequiredUserId()
    const db = getDb()

    await db
      .delete(skippedContents)
      .where(
        and(
          eq(skippedContents.sessionId, userId),
          eq(skippedContents.contentId, contentId),
          eq(skippedContents.contentType, contentType)
        )
      )

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
