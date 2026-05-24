# ROADMAP — StreamCurate

## 아키텍처 개요

```
[ 브라우저 ]
    │  (쿠키 session_id)
    ▼
[ Next.js App Router ]
    ├─ page.tsx         — 메인 큐레이션 페이지 (Server Component)
    ├─ /api/curate      — 큐레이션 목록 조회 (GET)
    ├─ /api/watched     — 봤어요 등록/해제 (POST/DELETE)
    └─ /api/preferences — 취향 설정 조회/저장 (GET/POST)

[ lib/ ]
    ├─ db.ts      — Drizzle + SQLite 연결
    ├─ schema.ts  — 테이블 정의
    ├─ tmdb.ts    — TMDb API 클라이언트 (포스터·평점·OTT providers)
    ├─ ai.ts      — Claude API 추천이유 생성
    └─ session.ts — 쿠키 기반 session_id 관리

[ components/ ]
    ├─ ContentCard.tsx        — 콘텐츠 카드 (호버 봤어요 버튼)
    ├─ CategoryTabs.tsx       — 드라마·영화·예능·다큐 탭
    ├─ OttFilterBar.tsx       — OTT 플랫폼 필터 토글
    ├─ YearRangeSlider.tsx    — 연도 범위 슬라이더
    ├─ GenrePreferences.tsx   — 장르 취향 설정 다이얼로그
    └─ RefreshButton.tsx      — 다시 추천받기 버튼
```

---

## DB 스키마

```typescript
// lib/schema.ts
export const sessions = sqliteTable('sessions', { ... })
export const userPreferences = sqliteTable('user_preferences', { ... })
export const watchedContents = sqliteTable('watched_contents', { ... })
export const curatedContents = sqliteTable('curated_contents', { ... })
```

---

## TMDb API 활용

```
GET /discover/movie?with_watch_providers={ids}&watch_region=KR&sort_by=vote_average.desc
GET /discover/tv?with_watch_providers={ids}&watch_region=KR&sort_by=vote_average.desc
GET /movie/{id}/watch/providers  → KR 필드
GET /genre/movie/list?language=ko-KR
GET /configuration  → 이미지 base URL

OTT Provider IDs (KR 기준):
  - 넷플릭스: 8
  - 웨이브: 356
  - 디즈니+: 337
  - 티빙: 97
```

---

## Sprint 계획

### Sprint 0 — 프로젝트 셋업
- [ ] `create-next-app` 초기화 (TypeScript, App Router, Tailwind)
- [ ] shadcn/ui CLI 초기화
- [ ] Drizzle ORM + better-sqlite3 설치
- [ ] 환경변수 설정 (TMDB_API_KEY, ANTHROPIC_API_KEY)
- [ ] .gitignore, .env.example 작성

### Sprint 1 — DB 스키마 + TMDb 클라이언트
- [ ] `lib/schema.ts` 테이블 정의
- [ ] `lib/db.ts` Drizzle 연결 (better-sqlite3)
- [ ] `lib/tmdb.ts` — discover, watch/providers 구현
- [ ] `lib/session.ts` — 쿠키 UUID 세션 유틸
- [ ] DB 마이그레이션 실행

### Sprint 2 — API Routes
- [ ] `GET /api/curate` — 카테고리·OTT·장르·연도 필터 기반 추천 목록
  - 봤어요 콘텐츠 제외
  - TMDb discover → 캐시 저장
  - Claude AI 추천이유 생성
- [ ] `POST /api/watched` — 봤어요 등록
- [ ] `DELETE /api/watched` — 봤어요 취소
- [ ] `GET/POST /api/preferences` — 취향 설정 조회/저장

### Sprint 3 — UI 컴포넌트
- [ ] `ContentCard.tsx` — 포스터·제목·OTT뱃지·평점·추천이유·호버봤어요버튼
- [ ] `CategoryTabs.tsx` — 드라마/영화/예능/다큐멘터리 탭
- [ ] `OttFilterBar.tsx` — 넷플릭스·티빙·디즈니+·웨이브 토글
- [ ] `YearRangeSlider.tsx` — 1990~현재 슬라이더 (shadcn Slider)
- [ ] `GenrePreferences.tsx` — 장르 선택 다이얼로그
- [ ] `RefreshButton.tsx` — 다시 추천받기

### Sprint 4 — 메인 페이지 통합
- [ ] `app/page.tsx` — 필터 + 카드 그리드 레이아웃
- [ ] 다크모드 지원
- [ ] 반응형 그리드 (2열→3열→4열)
- [ ] 로딩 스켈레톤 UI

### Sprint 5 — 테스트 + 마무리
- [ ] `npx tsc --noEmit` 오류 0개
- [ ] ESLint 오류 0개
- [ ] `npm run build` 성공
- [ ] .env.example 완성
- [ ] README.md 작성

### Sprint 6 — GitHub Push
- [ ] gh repo create streamcurate --public
- [ ] 초기 커밋 + push
