# PRD — StreamCurate (스트림큐레이트)

## 서비스 개요

한국 OTT 플랫폼(넷플릭스·티빙·디즈니+·웨이브)의 콘텐츠를 AI가 큐레이션하여 카드 형태로 추천하는 웹 서비스.
사용자 취향(장르 선호, 봤어요 기록, OTT 필터, 연도 범위)을 반영하여 개인화된 추천을 제공한다.

---

## 타겟 사용자 페르소나

**메인 페르소나**: 한국 OTT 다중 구독 직장인
- 넷플릭스·티빙·웨이브 등 2~3개 OTT를 동시 구독
- "오늘 뭐 볼지" 결정에 10분 이상 낭비
- 평점이 좋은 콘텐츠만 보고 싶지만 검색이 번거로움

---

## 핵심 기능 (MoSCoW)

### Must Have

| 기능 | 설명 |
|------|------|
| 카테고리별 큐레이션 | 드라마·예능·다큐멘터리·영화 탭별 추천 목록 |
| 콘텐츠 카드 UI | 포스터·제목·OTT 뱃지·평점·추천이유 표시 |
| 봤어요 기능 | 카드 호버 시 버튼 노출, 체크 시 재추천 제외 |
| 다시 추천받기 | 전체 목록 새 큐레이션 |
| OTT 플랫폼 필터 | 넷플릭스·티빙·디즈니+·웨이브 중 선택 |
| 장르 취향 설정 | 좋아하는/싫어하는 장르 설정 후 큐레이션 반영 |
| 연도 범위 슬라이더 | 1990~현재 사이 슬라이더, 미설정 시 연도 무관 |
| 명확한 추천이유 | TMDb 평점·인기도 근거 포함 |

### Should Have

| 기능 | 설명 |
|------|------|
| 세션 기반 식별 | 쿠키 UUID로 브라우저별 데이터 유지 |
| 봤어요 목록 | 시청 완료 콘텐츠 목록 확인 페이지 |
| OTT 바로가기 | 카드 클릭 시 해당 OTT 서비스로 이동 |

### Could Have (추후 정식 서비스 확장)

| 기능 | 설명 |
|------|------|
| 회원가입·로그인 | NextAuth 기반, 사용자별 큐레이션 |
| AI 개인화 추천이유 | Claude API로 사용자 취향 기반 맞춤 이유 생성 |
| 북마크 (나중에 보기) | 관심 콘텐츠 저장 |
| 별점·메모 | 봤어요 시 별점·한줄 감상 남기기 |

---

## 데이터 모델

### sessions
```
id: TEXT PRIMARY KEY (UUID)
created_at: INTEGER (timestamp)
last_seen: INTEGER (timestamp)
```

### user_preferences
```
id: INTEGER PRIMARY KEY AUTOINCREMENT
session_id: TEXT (FK → sessions.id)
liked_genres: TEXT (JSON array of genre IDs)
disliked_genres: TEXT (JSON array of genre IDs)
ott_filters: TEXT (JSON array: "netflix"|"tving"|"disney"|"wavve")
year_min: INTEGER (null = no filter)
year_max: INTEGER (null = no filter)
updated_at: INTEGER
```

### watched_contents
```
id: INTEGER PRIMARY KEY AUTOINCREMENT
session_id: TEXT (FK → sessions.id)
tmdb_id: INTEGER
media_type: TEXT ("movie"|"tv")
title: TEXT
watched_at: INTEGER (timestamp)
```

### curated_contents (캐시)
```
id: INTEGER PRIMARY KEY AUTOINCREMENT
tmdb_id: INTEGER
media_type: TEXT
title: TEXT
original_title: TEXT
overview: TEXT (Korean)
poster_path: TEXT
vote_average: REAL
vote_count: INTEGER
release_year: INTEGER
genre_ids: TEXT (JSON)
ott_providers: TEXT (JSON — KR 지역 기준)
recommendation_reason: TEXT
cached_at: INTEGER
```

---

## 기술 스택 명세

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | Next.js 15 (App Router) |
| UI | shadcn/ui + Tailwind CSS v4 |
| ORM | Drizzle ORM |
| DB | SQLite (better-sqlite3) |
| 콘텐츠 API | TMDb API v3 (무료) |
| AI 추천이유 | Anthropic Claude API (claude-haiku-4-5) |
| 세션 | cookie (UUID) |
| 배포 대상 | Vercel (Node.js runtime) |

---

## 비기능 요구사항

- 초기 로드 < 3초 (이미지 lazy loading, TMDb 캐싱)
- TMDb 응답은 SQLite에 24시간 캐시
- 봤어요 목록은 브라우저 세션 유지 (쿠키 만료 30일)
- 반응형 디자인 (모바일·태블릿·데스크탑)
- 다크모드 지원
