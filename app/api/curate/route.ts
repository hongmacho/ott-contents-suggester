import { NextRequest, NextResponse } from 'next/server'
import { getRequiredUserId } from '@/lib/auth-session'
import { getDb } from '@/lib/db'
import { watchedContents, skippedContents } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { discoverContent, type Category, type OriginLanguage } from '@/lib/tmdb'
import { generateRecommendationReason } from '@/lib/ai'

const VALID_CATEGORIES: Category[] = ['drama', 'variety', 'documentary', 'movie']
const VALID_LANGUAGES: OriginLanguage[] = ['ko', 'ja', 'zh', 'en', 'other']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const categoryParam = searchParams.get('category') ?? 'drama'
    const category = VALID_CATEGORIES.includes(categoryParam as Category)
      ? (categoryParam as Category)
      : 'drama'

    const ottsParam = searchParams.get('ottPlatforms') ?? ''
    const yearFromParam = searchParams.get('yearFrom')
    const yearToParam = searchParams.get('yearTo')
    const langsParam = searchParams.get('originLanguages') ?? ''
    const excludeAnimationParam = searchParams.get('excludeAnimation')
    const pageParam = searchParams.get('page')

    const providerIds = ottsParam
      ? ottsParam.split(',').map(Number).filter((n) => !isNaN(n) && n > 0)
      : []
    const yearFrom = yearFromParam ? parseInt(yearFromParam) : undefined
    const yearTo = yearToParam ? parseInt(yearToParam) : undefined
    const originLanguages: OriginLanguage[] = langsParam
      ? (langsParam.split(',').filter((l) => VALID_LANGUAGES.includes(l as OriginLanguage)) as OriginLanguage[])
      : []
    const excludeAnimation = excludeAnimationParam === '1'
    const page = pageParam ? Math.max(1, parseInt(pageParam)) : 1

    const userId = await getRequiredUserId()
    const db = getDb()

    const [watched, skipped] = await Promise.all([
      db.select({ contentId: watchedContents.contentId }).from(watchedContents).where(eq(watchedContents.sessionId, userId)),
      db.select({ contentId: skippedContents.contentId }).from(skippedContents).where(eq(skippedContents.sessionId, userId)),
    ])

    const excludedIds = [...new Set([...watched.map((w) => w.contentId), ...skipped.map((s) => s.contentId)])]

    const { items, hasMore } = await discoverContent({
      category,
      providerIds,
      yearFrom,
      yearTo,
      originLanguages,
      excludeAnimation,
      watchedIds: excludedIds,
      page,
    })

    const withReasons = await Promise.all(
      items.map(async (content) => ({
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

    return NextResponse.json({ success: true, data: withReasons, hasMore })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
