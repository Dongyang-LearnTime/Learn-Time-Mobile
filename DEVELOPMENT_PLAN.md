# LearnTime Mobile 개발 계획서

> 문서 목적: 개발 세션이 끊기거나 담당자/AI가 바뀌어도 이 문서만 읽고 작업을 이어갈 수 있도록 범위, 구조, API, 결정 사항과 진행 상태를 기록한다.

## 0. 문서 정보

- 최초 작성일: 2026-09-02
- 대상 프로젝트
  - 웹: `../LearnTime-Frontend`
  - 서버: `../LearnTime-Backend`
  - 모바일: 현재 `mobile` 폴더
- 현재 단계: 운영 서버/실기기 연동 완료, 자유 공부 타이머 백엔드 배포 및 APK 빌드 전
- 목표: Google Play 정식 출시가 아닌 실제 안드로이드 기기 동작 및 웹 연동 시연

## 1. 프로젝트 목표

LearnTime 웹의 모든 기능을 모바일에서 복제하지 않는다. 모바일에서 자주 쓰기 좋은 기능만 별도 앱으로 제공하고 기존 Spring Boot API와 MySQL 데이터를 공유한다.

핵심 시연 흐름은 다음과 같다.

1. 웹과 동일한 계정으로 앱에 로그인한다.
2. 앱에서 오늘의 학습 계획을 조회한다.
3. 계획을 선택하고 공부 타이머를 실행한다.
4. 측정한 집중 시간을 기존 서버에 저장한다.
5. 선택적으로 체중을 기록한다.
6. 웹을 새로고침하여 앱의 기록이 반영됐음을 확인한다.

별도의 모바일 서버, Firebase 데이터베이스, 양방향 동기화 서버는 만들지 않는다. 웹과 앱이 같은 REST API와 DB를 사용하므로 앱의 저장 요청이 곧 연동이다.

## 2. 확정 기술 스택

바이브코딩 성공 가능성과 기존 React 프론트엔드 지식 재사용을 우선한다.

| 구분 | 선택 | 용도 |
|---|---|---|
| 앱 프레임워크 | Expo + React Native | 안드로이드 앱 실행 및 빌드 |
| 언어 | TypeScript | 기존 프론트 타입과 지식 재사용 |
| 패키지 관리자 | pnpm | 기존 프론트와 통일 |
| 라우팅 | Expo Router | 파일 기반 화면 구성 |
| HTTP | Axios | 기존 API 코드 이식 |
| 전역 상태 | Zustand | 인증 및 타이머 상태 |
| 민감정보 저장 | `expo-secure-store` | Access Token 보관 |
| 일반 영속 상태 | AsyncStorage | 타이머 시작 시각과 임시 상태 복원 |
| 폼 | React Hook Form | 로그인 및 기록 폼 |
| 아이콘 | `@expo/vector-icons` | Expo 기본 호환 아이콘 |
| APK 빌드 | Expo EAS Build | Android Studio 없는 클라우드 빌드 |

초기 버전에서는 의존성을 최소화한다. React Query, UI 프레임워크, 날짜 라이브러리는 실제 중복 코드가 늘어날 때만 추가한다.

## 3. 개발 환경 결정

Android Studio는 필수가 아니다.

- 개발: VS Code/Codex + 터미널
- 실행: 실제 안드로이드폰의 Expo Go
- 결과물: EAS Build에서 생성한 APK를 실제 기기에 설치
- Android Studio를 도입하는 조건
  - 실기기 대신 에뮬레이터가 필요할 때
  - Expo가 지원하지 않는 네이티브 모듈을 쓸 때
  - Foreground Service 등 Android 네이티브 코드를 직접 구현할 때
  - 로컬 Gradle 빌드 또는 네이티브 디버깅이 필요할 때

현재 MVP에서는 Android Studio와 커스텀 네이티브 모듈을 사용하지 않는다.

## 4. MVP 범위

### 포함

- 이메일/비밀번호 로그인
- 로그인 상태 유지
- 로그아웃
- 사용자 이름, 포인트, 티어 요약 조회
- 오늘의 학습 계획 목록 조회
- 학습 계획 선택
- 공부 타이머 시작, 일시정지, 초기화
- 타이머 상태의 간단한 로컬 복원
- 집중 시간 서버 저장
- 체중 및 체지방 기록
- 운동 부위, 시간, 중량, 메모 기록
- 월별 일정 조회, 등록, 삭제
- 로딩, 빈 상태, 오류 메시지
- 앱에서 기록한 결과가 웹에 반영되는 통합 시연
- 설치 가능한 APK 생성

### 명시적 제외

- 회원가입과 이메일 인증
- Google/Kakao 소셜 로그인
- AI 학습 계획/퀴즈/피드백 생성
- 노트 에디터
- 커뮤니티, 친구, 차단, 쪽지
- SSE 실시간 알림과 Firebase 푸시 알림
- 식단 및 운동 수정/삭제 등 전체 관리
- 이미지 업로드
- 완전한 오프라인 동기화
- Android Foreground Service
- Play Store 출시
- 웹 전체 기능의 WebView 포장

제외 기능은 MVP가 끝난 뒤 필요성이 확인됐을 때만 추가한다.

## 5. 화면 설계

### 5.1 로그인 `/login`

- 이메일 입력
- 비밀번호 입력
- 로그인 버튼
- 오류 메시지
- 시연 계정 사용을 전제로 하므로 회원가입 링크는 제공하지 않는다.

성공 시 토큰을 저장하고 홈으로 이동한다. 실패 시 서버가 반환한 메시지를 표시한다.

### 5.2 홈 `/(tabs)`

- JWT에서 추출한 사용자 이름
- 현재 포인트와 티어
- 오늘의 학습 계획 카드 목록
- 각 계획의 제목, 내용, 진행 상태
- 선택한 계획으로 타이머 이동
- 당겨서 새로고침 또는 새로고침 버튼

### 5.3 타이머 `/(tabs)/timer`

- 타이머 화면에서 오늘 학습계획을 과목으로 선택
- `HH:mm:ss` 표시
- 시작/일시정지/초기화/저장
- 저장 중 중복 요청 방지
- 10초 미만 저장 차단
- 하루 최대 12시간으로 보정
- 완료된 계획에 추가 기록할 때 확인

웹의 기존 타이머 규칙을 최대한 동일하게 적용한다.

### 5.4 기록 `/(tabs)/record`

- 운동 부위, 시간, 선택 중량, 메모 입력 및 최근 기록
- 체중 입력
- 체지방률 입력
- 저장 버튼
- 최근 체중 기록 조회(시간이 허용되면 추가)

숫자 검증과 서버 오류만 명확히 처리한다.

### 5.5 설정 `/(tabs)/settings`

- 사용자 계정 정보
- 현재 API 서버 주소(개발 빌드에서만 표시 가능)
- 로그아웃
- 앱 버전

### 5.6 일정 `/(tabs)/schedule`

- 이전/다음 달 이동과 월별 일정 조회
- 일정 내용, 날짜, 시간, 중요 여부 입력
- 일정 등록
- 일정을 길게 눌러 삭제

## 6. 권장 폴더 구조

Expo 프로젝트 생성 후 다음 구조를 사용한다.

```text
mobile/
├── app/
│   ├── _layout.tsx
│   ├── login.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── index.tsx
│       ├── timer.tsx
│       ├── record.tsx
│       └── settings.tsx
├── src/
│   ├── api/
│   │   ├── client.ts
│   │   ├── authApi.ts
│   │   ├── userApi.ts
│   │   ├── studyApi.ts
│   │   └── exerciseApi.ts
│   ├── components/
│   ├── constants/
│   │   └── config.ts
│   ├── stores/
│   │   ├── authStore.ts
│   │   └── timerStore.ts
│   ├── types/
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   ├── study.ts
│   │   └── exercise.ts
│   └── utils/
│       ├── formatTime.ts
│       └── getApiError.ts
├── assets/
├── .env.example
├── app.json
├── eas.json
├── package.json
├── README.md
└── DEVELOPMENT_PLAN.md
```

## 7. 기존 서버 API 계약

아래 내용은 현재 웹 프론트 코드와 백엔드 컨트롤러를 기준으로 확인한 것이다. 구현 시 백엔드 DTO가 바뀌었는지 다시 확인한다.

### 7.1 로그인

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

성공 응답에는 최소한 다음 값이 있다.

```json
{
  "accessToken": "JWT",
  "tokenType": "Bearer"
}
```

JWT에서 사용하는 클레임:

- `userId`
- `name`
- `role`
- `sub`(이메일)

### 7.2 토큰 재발급

```http
POST /api/auth/refresh
Cookie: refreshToken=...
```

현재 Refresh Token은 `HttpOnly`, `Secure`, `SameSite=Lax` 쿠키로 발급된다. 모바일 쿠키 유지가 검증되기 전까지는 다음 단계로 구현한다.

1. 1차 MVP: Access Token 저장, 401이면 로그인 화면으로 이동
2. MVP 완료 후: Axios/React Native의 쿠키 동작을 실제 기기에서 검증
3. 필요 시: 모바일 친화적인 Refresh Token 전달 방식을 백엔드에 별도 설계

보안 결정을 임의로 바꾸거나 Refresh Token을 평문 AsyncStorage에 저장하지 않는다.

### 7.3 로그아웃

```http
POST /api/auth/logout
Authorization: Bearer {accessToken}
```

서버 요청 성공 여부와 관계없이 로컬 Access Token과 사용자 상태를 제거한다.

### 7.4 사용자 요약

```http
GET /api/user/summary
Authorization: Bearer {accessToken}
```

```ts
interface UserSummaryResponse {
  point: number;
  tierName: string;
  badges: UserBadgeResponse[];
  nextMinPoint: number;
}
```

### 7.5 오늘의 학습 계획

```http
GET /api/study/daily/today-plans
Authorization: Bearer {accessToken}
```

```ts
interface TodayStudyPlanResponse {
  studyId: number;
  studyTitle: string;
  studyDailyPlanId: number;
  planContent: string;
  progressStatus: string;
}
```

### 7.6 집중 시간 저장

```http
PATCH /api/study/daily/focus-time
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "studyDailyPlanId": 123,
  "focusTime": "00:12:34"
}
```

저장 규칙:

- 시간이 0이면 호출하지 않는다.
- 10초 미만은 앱에서 차단한다.
- 12시간(43,200초)을 넘으면 12시간으로 보정한다.
- 저장 중 버튼을 비활성화한다.
- 성공 시 타이머를 초기화하고 홈 데이터를 다시 조회한다.

### 7.6.1 자유 공부 집중 시간 저장

스터디 그룹이나 일일 계획이 없는 사용자도 사용자 계정에 직접 귀속되는 집중시간 세션을 저장한다.

```http
POST /api/study/focus-records
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "focusSeconds": 1800
}
```

최근 기록은 `GET /api/study/focus-records?size=5`로 조회한다. 각 세션을 별도 행으로 누적하며 기존 스터디 진도 통계와 섞지 않는다.

### 7.7 체중 기록

```http
POST /api/exercise/weight/save
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "weight": 70.5,
  "bodyFat": 18.2
}
```

응답 타입:

```ts
interface WeightResponse {
  id: number;
  weight: number;
  bodyFat: number;
  createdAt: string;
}
```

### 7.8 선택적 최근 체중 조회

```http
GET /api/exercise/weight
Authorization: Bearer {accessToken}
```

## 8. API 클라이언트 설계

`src/api/client.ts`에 Axios 인스턴스를 하나만 만든다.

- Base URL은 환경 변수 `EXPO_PUBLIC_API_BASE_URL`에서 읽는다.
- 모든 인증 요청에 `Authorization: Bearer {accessToken}`을 붙인다.
- 요청 제한 시간(timeout)을 지정한다.
- 401 응답 시 인증 상태를 비우고 `/login`으로 보낸다.
- 네트워크 오류와 서버 오류를 구분하여 사용자 메시지를 만든다.
- 화면 컴포넌트에서 URL 문자열을 직접 사용하지 않는다.

환경 예시:

```dotenv
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
```

비밀키는 `EXPO_PUBLIC_` 환경 변수에 넣지 않는다. 앱에는 공개되어도 되는 서버 URL만 둔다.

## 9. 인증 상태 설계

`authStore`가 다음 상태를 관리한다.

```ts
interface AuthState {
  accessToken: string | null;
  userId: number | null;
  userName: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
}
```

앱 시작 순서:

1. SecureStore에서 Access Token을 읽는다.
2. 토큰 형식과 만료 시각을 확인한다.
3. 유효하면 JWT 클레임을 상태에 채운다.
4. 없거나 만료됐으면 로그인 화면으로 이동한다.
5. 복원 중에는 스플래시/로딩 화면을 표시하여 화면 깜박임을 막는다.

주의: JWT 디코딩은 신뢰성 검증이 아니라 UI 표시용이다. 서버 권한 판단은 항상 백엔드가 한다.

## 10. 타이머 상태 설계

초기 MVP는 Foreground Service 없이 타임스탬프 계산 방식을 쓴다.

저장 상태:

```ts
interface TimerState {
  isPersonal: boolean;
  studyDailyPlanId: number | null;
  studyTitle: string | null;
  planContent: string | null;
  isRunning: boolean;
  startedAt: number | null;
  accumulatedSeconds: number;
}
```

계산 규칙:

```text
표시 시간 = accumulatedSeconds
          + (isRunning이면 현재시각 - startedAt, 아니면 0)
```

- 1초 간격 이벤트는 UI 갱신 용도일 뿐 실제 시간의 기준이 아니다.
- 시작/정지/초기화 때 AsyncStorage에 상태를 저장한다.
- 앱 재실행 시 저장된 시작 시각을 기준으로 복구한다.
- 앱 강제 종료, 기기 재부팅, 절전 정책까지 완벽히 보장하는 기능은 MVP 범위가 아니다.

## 11. 로컬 및 실기기 네트워크

실제 휴대폰에서 PC의 `localhost`는 PC를 가리키지 않는다.

- 실제 휴대폰: 같은 Wi-Fi에 연결하고 `http://<PC의 내부 IP>:<서버 포트>` 사용
- Android Emulator: 일반적으로 `http://10.0.2.2:<서버 포트>` 사용
- 배포 서버: HTTPS 도메인 사용 권장

현재 백엔드 CORS 기본값은 `http://localhost:5173`이다. 네이티브 앱 요청에는 브라우저 CORS가 그대로 적용되지 않지만, Expo Go/웹 실행 방식과 서버 환경에 따라 차이가 있으므로 실제 요청으로 검증한다.

Refresh Token 쿠키가 `Secure=true`이므로 HTTP 로컬 환경에서는 재발급이 실패할 수 있다. 이를 숨기지 말고 테스트 결과를 이 문서의 결정 기록에 남긴다.

## 12. 구현 단계와 완료 조건

### Phase 0 — 사전 연결 확인

- [x] 백엔드 실행 방법과 실제 API Base URL 확인
- [ ] 시연용 일반 사용자 계정 준비
- [ ] 휴대폰에서 백엔드 주소 접근 확인
- [ ] 로그인 API를 curl/Postman 또는 기존 웹에서 확인

확인 내용: 로컬 백엔드는 Docker Compose 기준 `8080` 포트를 사용하며 기존 웹의 운영 API 주소는 `https://api.learn-time.kr`이다. 2026-09-02 개발 환경에서 운영 API 연결을 시도했으나 10초 타임아웃이 발생했다. 로컬 백엔드는 Java 컴파일까지 성공했지만 설정된 MySQL 연결이 타임아웃되어 기동하지 못했다. 운영 서버와 DB의 가동/접근 상태를 먼저 확인해야 한다.

완료 조건: 실제 기기에서 사용할 서버 주소와 테스트 계정이 확정됨.

### Phase 1 — Expo 골격

- [x] `mobile`에 Expo TypeScript 프로젝트 생성
- [x] pnpm 설정
- [x] Expo Router 기본 라우팅 구성
- [x] 로그인 및 탭 화면 뼈대 생성
- [x] `.env.example`과 실제 환경 변수 구성
- [x] 앱 이름, 아이콘, 패키지 ID 지정

권장 Android package: `com.learntime.mobile` (충돌 여부 확인 후 확정)

완료 조건: Expo Go에서 로그인, 홈, 타이머, 기록, 설정 화면을 이동할 수 있음.

### Phase 2 — 인증

- [x] Axios 인스턴스 생성
- [x] 로그인 API 연결
- [x] Access Token SecureStore 저장
- [x] JWT 사용자 정보 추출
- [x] 인증 라우팅 가드
- [x] 401 처리
- [x] 로그아웃

완료 조건: 앱 재실행 후 로그인 상태가 복원되고 보호 화면 접근이 제어됨.

### Phase 3 — 홈과 계획 선택

- [x] 사용자 요약 API 연결
- [x] 오늘 계획 API 연결
- [x] 로딩/빈 상태/오류 상태 구현
- [x] 계획 선택 후 타이머 화면으로 전달
- [x] 새로고침 지원

완료 조건: 실제 계정의 포인트, 티어와 오늘 계획이 표시됨.

### Phase 4 — 타이머와 집중 시간 저장

- [x] Zustand 타이머 스토어
- [x] 타임스탬프 기반 시작/정지/초기화
- [x] AsyncStorage 복원
- [x] `HH:mm:ss` 변환
- [x] 입력 규칙 및 중복 저장 방지
- [x] 집중 시간 API 연결
- [x] 저장 성공 후 홈 갱신
- [x] 스터디 계획 없이 자유 공부 타이머 선택
- [x] 사용자 귀속 자유 공부시간 저장 및 최근 기록 조회 API

완료 조건: 앱에서 저장한 시간이 웹 학습 화면에 표시됨.

### Phase 5 — 체중 기록

- [x] 체중/체지방 폼
- [x] 숫자 범위와 필수값 검증
- [x] 체중 저장 API 연결
- [x] 성공/실패 피드백
- [x] 선택적으로 최근 기록 표시

완료 조건: 앱 기록이 웹 운동 페이지에 표시됨.

### Phase 5.5 — 운동 및 일정 관리

- [x] 운동 부위/시간/중량/메모 입력
- [x] 운동 저장 API와 최근 기록 연결
- [x] 타이머 화면 내 과목 선택으로 흐름 변경
- [x] 월별 일정 조회 및 달 이동
- [x] 일정 등록과 삭제 API 연결
- [x] 데모 모드 목업 데이터 연결

완료 조건: 코드와 데모 흐름 구현 완료. 실제 서버 반영 검증은 Phase 6에서 수행.

### Phase 6 — 안정화와 APK

- [ ] 네트워크 끊김, 401, 500 테스트
- [ ] 버튼 연타와 중복 저장 테스트
- [ ] 앱 재실행 시 인증/타이머 복원 테스트
- [ ] 실제 발표 계정 데이터 준비
- [x] `eas.json` preview APK 프로필 설정
- [ ] EAS에서 APK 빌드
- [ ] 발표 기기에 APK 설치 및 전체 시나리오 리허설

완료 조건: 개발 서버 도구 없이 발표 기기에 설치된 APK로 핵심 시나리오가 성공함.

## 13. 테스트 체크리스트

### 인증

- [ ] 정상 로그인
- [ ] 잘못된 비밀번호
- [ ] 서버 미실행/네트워크 단절
- [ ] 앱 재실행 후 로그인 복원
- [ ] 만료 토큰으로 API 호출
- [ ] 로그아웃 후 보호 화면 차단

### 타이머

- [ ] 시작과 일시정지 반복
- [ ] 초기화
- [ ] 백그라운드 후 복귀
- [ ] 앱 종료 후 복원
- [ ] 10초 미만 저장 차단
- [ ] 저장 버튼 연타 차단
- [ ] 저장 성공 후 웹 반영

### 기록

- [ ] 정상 소수 입력
- [ ] 빈 값, 문자, 음수 입력 차단
- [ ] 서버 저장 실패 시 값 유지
- [ ] 성공 후 웹 반영

### 빌드

- [ ] Expo Go 개발 실행
- [ ] EAS preview APK 빌드
- [ ] 새 기기에 APK 직접 설치
- [ ] APK에서 운영/시연 서버 연결

## 14. 시연 순서

발표 전에 웹과 앱을 같은 계정으로 준비한다.

1. APK로 LearnTime Mobile 실행
2. 테스트 계정 로그인
3. 홈에서 오늘의 학습 계획 확인
4. 계획을 선택하고 타이머 실행
5. 10초 이상 경과 후 저장
6. 웹의 해당 스터디 화면 새로고침
7. 집중 시간 반영 확인
8. 앱에서 체중 기록
9. 웹 운동 화면 새로고침
10. 동일 기록 반영 확인

발표 안정성을 위해 Access Token 만료 시간, 서버 상태, 테스트 계정의 오늘 계획 존재 여부를 직전에 확인한다.

## 15. 주요 리스크와 대응

| 리스크 | 영향 | 우선 대응 |
|---|---|---|
| Refresh 쿠키가 모바일/로컬 HTTP에서 유지되지 않음 | 토큰 자동 갱신 실패 | MVP는 401 시 재로그인, HTTPS 환경 우선 |
| 휴대폰에서 로컬 백엔드 접근 불가 | API 전체 실패 | 같은 Wi-Fi, PC IP, 방화벽 확인 |
| 오늘 학습 계획이 없음 | 타이머 저장 시연 불가 | 발표 전 계획이 있는 테스트 계정 준비 |
| Expo Go가 필요한 네이티브 기능을 지원하지 않음 | 기능 실행 불가 | MVP에서 네이티브 기능 제외, 필요 시 development build |
| 앱 백그라운드 중 타이머 중단 | 시간 표시 오류 | interval이 아닌 저장된 타임스탬프로 계산 |
| 서버 DTO 변경 | 런타임 오류 | 웹 API 파일과 백엔드 DTO를 다시 대조 |
| 범위 확장 | 완성도 저하 | 제외 목록을 유지하고 Phase 6 이후만 확장 |

## 16. 품질 원칙

- 서버 비즈니스 로직을 앱에서 중복 구현하지 않는다.
- API DTO 타입을 `any`로 두지 않는다.
- URL과 토큰을 화면 코드에 직접 작성하지 않는다.
- 에러를 `console.log`로만 끝내지 않고 사용자에게 안내한다.
- 로딩 중 동일 요청을 중복 전송하지 않는다.
- 기존 프론트나 백엔드를 수정해야 한다면 수정 이유와 모바일 영향도를 먼저 기록한다.
- 새 의존성은 실제 필요성과 Expo 호환성을 확인한 뒤 추가한다.
- MVP 완료 전 제외 기능을 추가하지 않는다.

## 17. 결정 기록

개발 중 중요한 판단이 바뀌면 아래 표에 추가한다. 과거 기록은 삭제하지 않는다.

| 날짜 | 결정 | 이유 | 영향 파일 |
|---|---|---|---|
| 2026-09-02 | 웹 전체 복제가 아닌 기록 중심 컴패니언 앱 채택 | 시연 목적과 구현 가능성 우선 | 전체 모바일 범위 |
| 2026-09-02 | Kotlin 대신 Expo/React Native/TypeScript 채택 | 기존 React 기술과 코드 구조 재사용 | 모바일 전체 |
| 2026-09-02 | Android Studio 없이 실기기 + EAS Build 우선 | 초기 환경 구성과 네이티브 빌드 부담 감소 | 개발/빌드 방식 |
| 2026-09-02 | 1차 MVP에서 자동 토큰 갱신 후순위 | Secure HttpOnly 쿠키의 실기기 동작을 먼저 검증해야 함 | 인증/API 클라이언트 |
| 2026-09-02 | 모바일 기본 API를 기존 운영 주소 `https://api.learn-time.kr`로 설정 | 실제 휴대폰에서 localhost 문제 없이 웹과 동일 서버 사용 | `.env`, API 클라이언트 |
| 2026-09-02 | `EXPO_PUBLIC_DEMO_MODE` 기반 목업 모드 추가 | AWS 중지 중에도 모바일 프론트 전체 흐름을 확인하기 위함 | 환경 설정, 인증/API 모듈 |
| 2026-09-02 | 타이머 과목 선택을 타이머 화면으로 이동 | 홈에서 계획을 미리 고르지 않고 바로 타이머를 사용할 수 있게 함 | 홈, 타이머, 타이머 스토어 |

## 18. 작업 로그

각 개발 세션이 끝날 때 아래 형식으로 최신 항목을 위에 추가한다.

```markdown
### YYYY-MM-DD — 작업 제목

- 완료:
- 변경 파일:
- 검증 방법과 결과:
- 남은 문제:
- 다음 작업:
```

### 2026-09-02 — 운동 기록·타이머 과목 선택·일정 관리 추가

- 완료: 운동 부위/시간/중량/메모 기록 및 최근 목록, 타이머 화면 내 과목 선택, 월별 일정 조회/등록/삭제, 전 기능 데모 데이터
- 변경 파일: 기록/타이머/홈/일정/탭 화면, 운동·일정 타입과 API, 목업 데이터
- 검증 방법과 결과: TypeScript 검사 통과, Expo 웹 export 성공, 재시작한 개발 서버에서 새 일정 라우트 포함 웹 번들 정상 실행
- 남은 문제: 집중 시간 API 특성상 과목은 오늘 학습계획과 연결돼야 함, 자유 과목의 서버 저장은 백엔드 모델/엔드포인트 추가 필요, 실제 서버 통합 검증 미완료
- 다음 작업: 데모 UI 수동 확인 후 AWS 복구 시 운동·일정·집중시간 실제 저장 검증

### 2026-09-02 — 백엔드 중지 대응 및 프론트 데모 검증

- 완료: 백엔드 없는 데모 로그인, 목업 사용자/학습계획/집중시간/체중 데이터, 웹용 토큰 저장소 분기, Expo 웹 의존성 추가
- 변경 파일: `mobile/.env`, `.env.example`, `src/constants/config.ts`, `src/api`, `src/stores/authStore.ts`, 로그인/설정 화면, README
- 검증 방법과 결과: TypeScript 검사 통과, Expo 웹 정적 번들 생성 성공, 개발 서버 `http://localhost:19006`에서 HTTP 200과 LearnTime root HTML 확인
- 발견 및 수정: 웹에서 지원되지 않는 SecureStore 호출을 AsyncStorage 분기로 교체
- 남은 문제: 현재 환경에 연결된 브라우저가 없어 자동 클릭/시각 검증은 미완료, 실제 Android Expo Go 검증 필요
- 다음 작업: 브라우저 또는 휴대폰에서 데모 모드의 로그인 → 홈 → 타이머 → 체중 기록 흐름을 확인한 뒤 결과를 체크리스트에 기록

### 2026-09-02 — Expo MVP 구현

- 완료: Expo SDK 57 프로젝트, 탭 라우팅, 로그인과 인증 복원, 사용자/오늘 계획 홈, 영속 타이머와 집중 시간 저장, 체중 기록과 최근 목록, 설정/로그아웃, EAS preview APK 설정
- 변경 파일: `mobile/app`, `mobile/src`, `mobile/package.json`, `mobile/app.json`, `mobile/eas.json`, 환경 설정 및 잠금 파일
- 검증 방법과 결과: TypeScript `tsc --noEmit` 성공, Android용 Expo export/Metro 번들 생성 성공, Expo Doctor 21/21 통과
- 남은 문제: 운영 API 연결 시 10초 타임아웃 발생, 로컬 백엔드도 MySQL 연결 타임아웃으로 기동 실패, 시연 계정 미확정, 실제 휴대폰 Expo Go 실행 및 API 통합 검증 미완료, APK 빌드 미실행
- 다음 작업: 운영 서버 및 DB 가동 여부와 시연 계정을 확인한 뒤 실기기에서 로그인 → 계획 조회 → 집중 시간 저장 → 웹 반영 → 체중 저장을 검증하고 Phase 6 진행

### 2026-09-02 — 개발 계획 수립

- 완료: 기술 스택, MVP 범위, API 계약, 구현 단계, 테스트 및 시연 계획 작성
- 변경 파일: `mobile/DEVELOPMENT_PLAN.md`, `mobile/README.md`
- 검증 방법과 결과: 기존 웹 API 모듈과 백엔드 인증/컨트롤러 구조 대조
- 남은 문제: 실제 API 서버 URL과 시연용 계정 미확정
- 다음 작업: Phase 0 확인 후 Expo 프로젝트 생성

## 19. 다음 세션 시작 절차

개발을 재개하는 사람 또는 AI는 반드시 다음 순서로 진행한다.

1. 이 문서를 처음부터 읽는다.
2. `git status` 또는 현재 변경 파일을 확인하고 사용자의 기존 작업을 보존한다.
3. `작업 로그`의 마지막 항목과 `구현 단계` 체크박스를 확인한다.
4. 기존 웹 API 파일 및 백엔드 DTO와 필요한 계약을 다시 대조한다.
5. 미완료 Phase 중 가장 앞 단계 하나만 진행한다.
6. 타입 검사, 린트, 실제 기기 또는 가능한 범위의 실행 검증을 한다.
7. 체크박스, 결정 기록, 작업 로그를 갱신한다.

다음 작업을 요청할 때 사용할 수 있는 문장:

> `mobile/DEVELOPMENT_PLAN.md`를 전체 확인하고 현재 작업 상태를 파악한 뒤, 기존 변경을 보존하면서 다음 미완료 Phase를 구현하고 계획서의 체크박스와 작업 로그를 갱신해줘.
