import Anthropic from '@anthropic-ai/sdk'
import type { ContentType } from './tmdb'

interface ContentInfo {
  title: string
  overview: string
  voteAverage: number
  voteCount: number
  contentType: ContentType
}

function fallbackReason(info: ContentInfo): string {
  const type = info.contentType === 'movie' ? '영화' : '콘텐츠'
  const rating = info.voteAverage.toFixed(1)
  const count = info.voteCount.toLocaleString('ko-KR')
  if (info.voteAverage >= 8.0) {
    return `TMDb ${count}명이 ${rating}/10점을 준 명작입니다. 높은 완성도와 압도적인 대중의 지지를 받은 ${type}로, 놓치면 후회할 작품입니다.`
  }
  if (info.voteAverage >= 7.0) {
    return `TMDb ${count}명 평균 ${rating}/10점의 검증된 ${type}입니다. 탄탄한 스토리와 캐릭터로 폭넓은 시청자들의 호평을 받고 있습니다.`
  }
  return `TMDb ${count}명이 ${rating}/10점으로 평가한 인기 ${type}입니다. 많은 시청자들이 선택한 작품으로 충분한 즐거움을 선사합니다.`
}

export async function generateRecommendationReason(info: ContentInfo): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return fallbackReason(info)

  try {
    const client = new Anthropic({ apiKey })
    const typeLabel = info.contentType === 'movie' ? '영화' : 'TV 프로그램'
    const prompt = `다음 ${typeLabel}에 대한 추천 이유를 한국어로 2문장으로 작성해주세요.

제목: ${info.title}
줄거리: ${info.overview.slice(0, 200)}
TMDb 평점: ${info.voteAverage.toFixed(1)}/10 (${info.voteCount.toLocaleString('ko-KR')}명 평가)

요구사항:
- 평점 수치를 자연스럽게 포함하세요
- 시청을 유도하는 설득력 있는 문장으로 작성하세요
- 정확히 2문장, 간결하게`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    })

    const block = message.content[0]
    if (block.type !== 'text') return fallbackReason(info)
    return block.text.trim()
  } catch {
    return fallbackReason(info)
  }
}
