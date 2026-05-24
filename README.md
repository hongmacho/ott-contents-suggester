# HONGCHA — OTT 콘텐츠 추천 서비스

> 넷플릭스, 티빙, 디즈니+, 웨이브에서 지금 볼 만한 콘텐츠를 큐레이션해드립니다.

## Features

- 드라마 · 영화 · 예능 · 다큐멘터리 카테고리별 탐색
- OTT 플랫폼 필터 (Netflix / Tving / Disney+ / Wavve)
- 출시 연도 범위 슬라이더 필터
- AI 기반 추천 이유 (Claude Haiku + TMDb 평점 근거)
- "봤어요" 체크 → 본 콘텐츠 제외 후 재추천
- 쿠키 기반 세션으로 설정 자동 저장

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | shadcn/ui · Tailwind CSS |
| Database | SQLite (better-sqlite3) · Drizzle ORM |
| Content API | TMDb API v3 |
| AI Reasoning | Anthropic Claude Haiku |

## Getting Started

### Prerequisites

- Node.js 20+
- TMDb API 키 ([발급](https://www.themoviedb.org/settings/api))
- Anthropic API 키 ([발급](https://console.anthropic.com))

### Installation

```bash
npm install
cp .env.example .env.local
# .env.local에 API 키 입력
```

### Environment Variables

```
TMDB_API_KEY=your_tmdb_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Run

```bash
npm run dev   # 개발 서버 (http://localhost:3000)
npm run build # 프로덕션 빌드
npm start     # 프로덕션 서버
```

## License

MIT
