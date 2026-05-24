import { NextRequest, NextResponse } from 'next/server'
import { getRequiredUserId } from '@/lib/auth-session'
import { getDb } from '@/lib/db'
import { preferences } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const userId = await getRequiredUserId()
    const db = getDb()

    const [pref] = await db
      .select()
      .from(preferences)
      .where(eq(preferences.sessionId, userId))
      .limit(1)

    if (!pref) {
      return NextResponse.json({
        success: true,
        data: { ottPlatforms: [], yearFrom: null, yearTo: null, originLanguages: [], excludeAnimation: false },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        ottPlatforms: JSON.parse(pref.ottPlatforms) as number[],
        yearFrom: pref.yearFrom,
        yearTo: pref.yearTo,
        originLanguages: JSON.parse(pref.originLanguages ?? '[]') as string[],
        excludeAnimation: pref.excludeAnimation,
      },
    })
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
    const ottPlatforms: number[] = Array.isArray(body.ottPlatforms) ? body.ottPlatforms : []
    const yearFrom: number | null = body.yearFrom ?? null
    const yearTo: number | null = body.yearTo ?? null
    const originLanguages: string[] = Array.isArray(body.originLanguages) ? body.originLanguages : []
    const excludeAnimation: boolean = Boolean(body.excludeAnimation)

    const userId = await getRequiredUserId()
    const db = getDb()

    await db
      .insert(preferences)
      .values({
        sessionId: userId,
        ottPlatforms: JSON.stringify(ottPlatforms),
        yearFrom,
        yearTo,
        originLanguages: JSON.stringify(originLanguages),
        excludeAnimation,
        updatedAt: Date.now(),
      })
      .onConflictDoUpdate({
        target: preferences.sessionId,
        set: {
          ottPlatforms: JSON.stringify(ottPlatforms),
          yearFrom,
          yearTo,
          originLanguages: JSON.stringify(originLanguages),
          excludeAnimation,
          updatedAt: Date.now(),
        },
      })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
