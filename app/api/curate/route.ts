import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateSession } from '@/lib/session'
import { getDb } from '@/lib/db'
import { watchedContents } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { discoverContent, type Category } from '@/lib/tmdb'
import { generateRecommendationReason } from '@/lib/ai'

const VALID_CATEGORIES: Category[] = ['drama', 'variety', 'documentary', 'movie']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const categoryParam = searchParams.get('category') ?? 'drama'
    const category = VALID_CATEGORIES.includes(categoryParam as Category)
      ? (categoryParam as Category)
      : 'drama'

    const ottsParam = searchParams.get('otts') ?? ''
    const yearFromParam = searchParams.get('yearFrom')
    const yearToParam = searchParams.get('yearTo')

    const providerIds = ottsParam
      ? ottsParam.split(',').map(Number).filter((n) => !isNaN(n) && n > 0)
      : []
    const yearFrom = yearFromParam ? parseInt(yearFromParam) : undefined
    const yearTo = yearToParam ? parseInt(yearToParam) : undefined

    const { sessionId } = await getOrCreateSession()
    const db = getDb()

    const watched = db
      .select({ contentId: watchedContents.contentId })
      .from(watchedContents)
      .where(eq(watchedContents.sessionId, sessionId))
      .all()

    const watchedIds = watched.map((w) => w.contentId)

    const contents = await discoverContent({
      category,
      providerIds,
      yearFrom,
      yearTo,
      watchedIds,
    })

    const withReasons = await Promise.all(
      contents.map(async (content) => ({
        ...content,
        recommendationReason: await generateRecommendationReason({
          title: content.title,
          overview: content.overview,
          voteAverage: content.voteAverage,
          voteCount: content.voteCount,
          contentType: content.contentType,
        }),
      }))
    )

    return NextResponse.json({ success: true, data: withReasons })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
