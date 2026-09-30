<div align="center">
  <img src="./assets/icon.png" alt="LearnTime 로고" width="144" />
  <h1>LearnTime Mobile</h1>
  <p><strong>공부와 운동, 매일의 성장을 한곳에서.</strong></p>
  <p>웹과 같은 계정으로 공부 진도, 집중 시간, 운동 기록과 일정을 관리하는 Android 앱</p>
  <p>
    <img alt="Android" src="https://img.shields.io/badge/Android-3DDC84?style=flat-square&logo=android&logoColor=white" />
    <img alt="Expo SDK 57" src="https://img.shields.io/badge/Expo-SDK%2057-000020?style=flat-square&logo=expo&logoColor=white" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
    <img alt="Light and Dark" src="https://img.shields.io/badge/Theme-Light%20%2F%20Dark-6555D9?style=flat-square" />
  </p>
  <p>
    <a href="#주요-기능">주요 기능</a> ·
    <a href="#빠른-시작">빠른 시작</a> ·
    <a href="#apk-빌드">APK 빌드</a> ·
    <a href="./SECURITY.md">보안 검토</a>
  </p>
</div>

---

## 주요 기능

| 화면 | 할 수 있는 일 |
| :--- | :--- |
| **홈** | 티어와 획득 배지, 오늘의 진도율, 공부 계획별 시작·완료·이해도 기록 |
| **공부 진도** | 학습 항목을 구분선으로 읽고, 쪽수와 복습 표시 및 일차별 계획 확인 |
| **집중 타이머** | 오늘의 계획 선택, 시작·일시정지·초기화, 집중 시간 저장, 앱 복귀 시 경과 시간 복원 |
| **운동·신체 기록** | 운동 부위·시간·중량·메모, 최근 7일 운동량, 체중·체지방률과 최근 기록 |
| **일정** | 한 달 달력, 날짜별 일정, 중요 일정 표시, 월 이동·오늘 이동, 일정 등록·삭제 |
| **설정** | 계정·서버 정보 확인, 로그아웃, 기기 설정·라이트·다크 모드 선택 |

**데이터 연동:** 실제 API 모드에서는 기존 LearnTime 백엔드를 사용합니다. 개발 중에는 서버 없이 흐름을 확인할 수 있는 데모 모드도 제공합니다.

## 사용 흐름

```text
로그인 → 홈에서 오늘의 계획 시작 → 타이머로 집중 → 집중 시간 저장 → 진도 완료
                       ↓
             일정 확인 · 운동 기록 · 성장 확인
```

- 집중 시간은 **10초 이상, 최대 12시간**을 기록합니다.
- 저장하지 않은 집중 시간이 있으면 다른 계획으로 변경하기 전에 확인합니다.
- 진도를 완료하기 전에 해당 계획의 집중 시간을 먼저 저장합니다.
- 달력에서 날짜를 누르고 **+** 버튼으로 그 날짜의 일정을 추가합니다.
- 다크모드는 **설정 → 화면 모드**에서 선택하며, 다음 실행에도 유지됩니다.

## 빠른 시작

### 1. 프로젝트 준비

Node.js와 pnpm을 설치한 환경에서 실행합니다.

```bash
git clone https://github.com/Dongyang-LearnTime/Learn-Time-Mobile.git
cd Learn-Time-Mobile
pnpm install --frozen-lockfile
cp .env.example .env
```

### 2. 서버 설정

`.env`에서 사용할 서버를 지정합니다. 휴대폰에서 PC의 서버를 사용할 때에는 같은 Wi-Fi의 **PC 내부 IP**를 입력합니다.

```dotenv
EXPO_PUBLIC_API_BASE_URL=https://api.learn-time.kr
EXPO_PUBLIC_DEMO_MODE=false
```

서버 없이 화면을 확인하려면 개발 서버에서 데모 모드를 켭니다.

```dotenv
EXPO_PUBLIC_DEMO_MODE=true
```

> `EXPO_PUBLIC_*` 값은 앱 번들에 포함됩니다. 비밀번호, 토큰, API 비밀 키를 넣지 마세요. 데모 인증과 개발용 HTTP 주소는 릴리스 모드에서 차단됩니다.

### 3. 개발 서버 실행

```bash
pnpm start
```

프로젝트 SDK와 호환되는 Expo Go 또는 Android 개발 클라이언트에서 연결합니다. 기본 API 주소는 HTTPS를 사용하고, 개발 서버에서만 localhost·유효한 사설 IPv4 주소의 HTTP를 허용합니다.

## APK 빌드

빌드에는 연결된 Expo 프로젝트에 대한 계정 권한이 필요합니다. `app.json`의 EAS 프로젝트 설정과 `eas.json`의 빌드 프로필을 확인하세요.

```bash
# Android 설치용 APK 빌드 요청
pnpm apk

# 최근 빌드 상태 확인
pnpm apk:status
```

| 프로필 | 용도 | API / 데모 설정 |
| :--- | :--- | :--- |
| `preview` | 내부 설치용 APK | 운영 HTTPS API / 데모 끔 |
| `production` | 배포용 Android 빌드 | 운영 HTTPS API / 데모 끔 |

APK 생성은 EAS 서버에서 진행됩니다. 완료된 파일은 EAS 빌드 페이지에서 다운로드하며, 로컬 `builds/`의 APK는 Git에 포함하지 않습니다.

## 기술 구성

| 영역 | 사용 기술 |
| :--- | :--- |
| 앱 | Expo SDK 57 · React Native · TypeScript |
| 화면 이동 | Expo Router |
| 상태 관리 | Zustand |
| 서버 통신 | Axios |
| 입력 폼 | React Hook Form |
| 기기 저장소 | Expo SecureStore |
| 테마 | 기기 색상 설정 · Expo System UI |

```text
app/                 로그인, 홈, 타이머, 기록, 일정, 설정 화면
src/api/             API 요청, 토큰 갱신, 개발용 목업 데이터
src/components/      공통 화면, 안내 메시지, 차트, 공부 내용 표시
src/constants/       서버 설정, 테마, 티어·배지 이미지 매핑
src/stores/          인증, 계정별 타이머, 테마 상태
src/storage/         SecureStore 접근과 순서 보장
src/types/           API 데이터 타입
src/utils/           날짜, 시간, 공부 내용 파싱, 오류 처리
tests/               인증·통신·타이머 보안 회귀 테스트
assets/              앱 아이콘, 로고, 티어·배지 이미지
```

## 품질 확인

```bash
pnpm typecheck          # TypeScript 검사
pnpm test               # 보안 회귀 테스트
pnpm audit --prod       # 의존성 취약점 감사
pnpm exec expo export --platform android  # Android 번들 생성 검사
```

회귀 테스트는 네트워크와 기기 저장소를 격리해 토큰 갱신/로그아웃 경쟁, 계정 간 타이머 분리, 저장 실패 시 기록 보존, API 주소 제한을 검사합니다. 실기기 설치·화면·운영 API 통합 검증은 별도로 필요합니다.

## 보안 및 개발 문서

- [보안 검토와 운영 시 확인할 사항](./SECURITY.md)
- [개발 계획, API 계약, 작업 기록](./DEVELOPMENT_PLAN.md)

액세스 토큰과 타이머는 SecureStore에 저장합니다. 로그아웃 또는 계정 변경 시 메모리의 인증·타이머 상태를 지우고, 이전 계정의 요청 응답을 재사용하지 않습니다. 서버는 별도로 JWT 서명, 요청 대상의 소유권과 입력 값을 검증해야 합니다.

> 이 저장소는 Android 시연 앱의 소스입니다. 자동 검사가 실제 단말·백엔드의 보안 검증 전체를 대신하지는 않습니다.
