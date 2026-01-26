# QFeed Frontend

AI 기반 기술 면접 준비 플랫폼

## 프로젝트 개요
- **목적**: 기술 면접 연습 및 AI 피드백 제공
- **타겟**: 취업 준비생, 이직 준비자
- **주요 기능**: 음성/텍스트 답변, STT 변환, 키워드 분석, AI 피드백

## 기술 스택

### 코어
- React 18.3.1
- Vite 7.2.4
- React Router DOM v7.12.0

### UI/스타일링
- Tailwind CSS 4.1
- ShadCN UI (Radix UI 기반)
- Framer Motion 12.27
- Recharts 3.6 (차트)

### 폼/유틸리티
- React Hook Form 7.71
- Lucide React (아이콘)
- Material-UI Icons

## 프로젝트 구조

```
src/
├── app/
│   ├── App.jsx              # 메인 라우팅
│   ├── components/
│   │   ├── AppHeader.jsx    # 공통 헤더
│   │   ├── BottomNav.jsx    # 하단 네비게이션
│   │   └── ui/              # ShadCN UI 컴포넌트
│   ├── hooks/               # 커스텀 훅 (useDebounce)
│   └── pages/               # 페이지 컴포넌트
├── data/                    # 질문 데이터 (questions.json)
├── utils/                   # 유틸리티 (storage.js)
├── styles/                  # CSS (index.css, theme.css)
└── main.jsx                 # 앱 진입점
```

## 라우팅 구조

| 라우트 | 페이지 | 설명 |
|--------|--------|------|
| `/splash` | Splash | 스플래시 화면 |
| `/login` | AuthLogin | 카카오 로그인 |
| `/` | Home | 홈 대시보드 |
| `/practice` | PracticeMain | 연습 모드 질문 목록 |
| `/practice/answer/:id` | PracticeAnswer | 답변 방식 선택 |
| `/practice/answer-voice/:id` | PracticeAnswerVoice | 음성 답변 녹음 |
| `/practice/answer-text/:id` | PracticeAnswerText | 텍스트 답변 작성 |
| `/practice/answer-edit/:id` | PracticeAnswerEdit | 답변 수정 |
| `/practice/stt/:id` | PracticeSTT | 음성→텍스트 변환 |
| `/practice/result-keyword/:id` | PracticeResultKeyword | 키워드 분석 결과 |
| `/practice/result-ai/:id` | PracticeResultAI | AI 피드백 결과 |
| `/real-interview` | RealInterview | 실전 모드 (Coming Soon) |
| `/profile` | ProfileMain | 프로필/통계 |
| `/settings` | SettingMain | 설정 |

## 주요 컴포넌트

### 공통 컴포넌트
- **AppHeader**: 페이지 헤더 (뒤로가기, 제목, 알림)
- **BottomNav**: 하단 네비게이션 (홈, 연습, 실전, 프로필)

### UI 컴포넌트 (ShadCN)
- Button, Card, Badge, Input, Textarea
- Checkbox, Switch, Progress
- AlertDialog, Avatar, Toaster (sonner)

## 데이터 저장 (LocalStorage)

### 키 네이밍 규칙
접두사: `qfeed_`

### 주요 키
- `qfeed_is_logged_in` - 로그인 상태
- `qfeed_user_nickname` - 사용자 닉네임
- `qfeed_learning_records` - 학습 기록
- `qfeed_practice_answers` - 저장된 답변

### 유틸리티
`src/utils/storage.js` 사용

## 스타일링 규칙

### Tailwind CSS
- 모바일 우선 디자인
- 컨테이너: `max-w-lg mx-auto`
- 그라디언트 테마: `bg-gradient-to-br from-pink-500 to-rose-500`

### 테마 색상 (CSS 변수)
- Primary: 핑크/로즈 계열
- Background: 흰색/회색
- `styles/theme.css` 참조

### 컴포넌트 스타일
- CVA (Class Variance Authority) 사용
- `cn()` 유틸리티로 클래스 병합

## 질문 데이터 스키마

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "category": "CS기초 | 시스템디자인",
  "difficulty": "하 | 중 | 상",
  "keywords": ["string"]
}
```

## 개발 명령어

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 린트
npm run lint
```

## 코딩 컨벤션

### 파일 네이밍
- 컴포넌트: PascalCase (예: `AppHeader.jsx`)
- 유틸리티: camelCase (예: `storage.js`)
- 스타일: kebab-case (예: `theme.css`)

### Import 경로
- 절대 경로: `@/` = `src/`
- 예: `import { Button } from '@/app/components/ui/button'`

### 컴포넌트 구조
- 함수형 컴포넌트 사용
- Named export 선호 (UI 컴포넌트)
- Default export (페이지 컴포넌트)

## 주의사항

### 보호된 라우트
- 로그인 상태 확인 후 리다이렉트
- `storage.js`의 `isLoggedIn()` 사용

### 반응형 디자인
- 모바일 우선 (max-w-lg 컨테이너)
- 터치 친화적 UI

### API 연동 (예정)
- 현재 LocalStorage 기반 목업
- 추후 백엔드 API 연동 필요

---

## 백엔드 API 정보

### 백엔드 기술 스택
- Spring Boot 4.0.1 + JDK 25
- SpringDoc OpenAPI 2.7.0 (Swagger)
- OAuth2 (Kakao) + JWT 인증
- PostgreSQL / H2 (개발)
- AWS S3 파일 저장

### Swagger UI
- URL: `http://localhost:8080/swagger-ui.html`
- OpenAPI: `http://localhost:8080/v3/api-docs`

### API 엔드포인트 요약

#### 인증 (`/api/auth`)
- `GET /oauth/authorization-url?provider=kakao` - OAuth URL
- `GET /oauth/{provider}/callback` - OAuth 콜백
- `POST /tokens` - 토큰 갱신
- `POST /logout` - 로그아웃

#### 답변 (`/api`)
- `GET /answers` - 답변 목록
- `GET /answers/{id}` - 답변 상세
- `POST /interview/answers` - 텍스트 답변 제출
- `GET /interviews/answers/{id}/feedback` - AI 피드백

#### 질문 (`/api/questions`)
- `GET /` - 질문 목록 (cursor 페이지네이션)
- `GET /{id}` - 질문 상세
- `GET /search?q=keyword` - 검색
- `GET /{id}/keywords` - 핵심 키워드
- `POST /{id}/keyword-checks` - 키워드 매칭

#### 평가지표 (`/api/metrics`)
- CRUD 엔드포인트

#### 파일 (`/api/files`)
- `POST /presigned-url` - S3 업로드 URL
- `POST /{id}/confirm` - 업로드 확인

### 응답 포맷

```json
// 성공
{ "message": "success_key", "data": {...} }

// 에러
{ "errorCode": "ERROR_CODE", "errorMessage": "설명" }
```

### CSRF 보안 현황 및 확장 가능성

#### 현재 상태
- CSRF 비활성화 (`SecurityConfig.java:32`)
- JWT 헤더 인증 사용으로 대부분 안전
- Refresh Token (HTTP-only 쿠키)에 잠재적 위험

#### 확장 시 수정 파일
| 파일 | 경로 |
|------|------|
| SecurityConfig.java | `auth/security/config/` |
| CookieServiceImpl.java | `auth/service/impl/` |
| OAuthController.java | `auth/controller/` |

#### 권장 조치 (우선순위)
1. **SameSite 속성 추가** (즉시)
   ```java
   cookie.setAttribute("SameSite", "Strict");
   ```
2. Origin/Referer 헤더 검증 (선택)
3. 전면 CSRF 토큰 구현 (필요시)

---

## 환경 설정

### 프론트엔드 (Vite)

#### 개발 서버
```bash
npm run dev      # http://localhost:5173
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 미리보기
```

#### 환경 변수 (.env 파일)
```env
# .env.development
VITE_API_BASE_URL=http://localhost:8080

# .env.production
VITE_API_BASE_URL=https://api.qfeed.com
```

### 백엔드 (Spring Boot)

#### 필수 환경 변수
```bash
# OAuth2 (Kakao)
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret

# JWT
JWT_SECRET=your_jwt_secret_key_min_256_bits

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET_NAME=qfeed-files

# AI 서비스
AI_FEEDBACK_BASE_URL=http://ai-server:8000
AI_STT_BASE_URL=http://stt-server:8000

# 리다이렉트
BASE_URL=http://localhost:8080
OAUTH2_REDIRECT_URI=http://localhost:3000/oauth2/redirect
```

#### 개발 환경 (기본값)
- DB: H2 인메모리 (`jdbc:h2:mem:testdb`)
- H2 콘솔: `http://localhost:8080/h2-console`
- 메인 서버: `http://localhost:8080`
- Actuator: `http://localhost:8081`

#### 운영 환경
- DB: PostgreSQL
- HTTPS 필수
- Actuator 분리 포트

#### JWT 설정
- Access Token: 10분 (600000ms)
- Refresh Token: 14일 (1209600000ms)

#### 모니터링 엔드포인트 (포트 8081)
- `/actuator/health` - 헬스체크
- `/actuator/metrics` - 메트릭
- `/actuator/prometheus` - Prometheus
