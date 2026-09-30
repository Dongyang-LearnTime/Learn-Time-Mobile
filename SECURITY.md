# Security notes

## 저장소에 포함하지 않는 파일

- `.env`, `.env.*` (`.env.example`만 예외)
- `node_modules`, `.expo`, `dist`, `web-build`
- Android/iOS 생성 폴더
- 서명 키와 인증서(`*.jks`, `*.p8`, `*.p12`, `*.key`, `*.pem`, `*.mobileprovision`)
- Firebase/서비스 계정 설정과 자격증명 JSON

실제 비밀값은 Git에 커밋하지 않는다. 저장소에는 공개 가능한 변수 이름과 예시만 `.env.example`로 제공한다.

## 2026-09-30 — 조직 저장소 푸시 전 검토

검토 범위: 모바일 앱의 전체 추적 소스·설정·의존성과 기존 Git 이력. 운영 서버 공격 테스트나 실기기 검증은 수행하지 않았다.

| 발견 사항 | 조치 |
| --- | --- |
| 늦게 도착한 토큰 갱신/401 응답이 로그아웃 또는 새 계정에 영향을 줄 수 있음 | 세션 버전 확인, 동일 세션 갱신 공유, 이전 세션의 응답·재시도 거부 |
| 이전 계정의 타이머가 기기에 남고 같은 계획 재선택 시 시간이 초기화됨 | 소유자 확인, 계정 변경 시 초기화, 같은 계획의 시간 보존 |
| 저장 실패 전에 메모리 기록을 지워 집중 시간이 사라질 수 있음 | 기기 저장 성공 후 상태 변경, 저장 중 과목 변경·중복 저장 차단 |
| 개발 HTTP 주소 검사에서 사설 IP처럼 시작하는 도메인을 허용함 | 전체 IPv4 주소 검증, 외부 URL/baseURL로 인증 토큰 전송 거부 |
| `brace-expansion@5.0.9` 간접 의존성의 취약점 3건 | 수정 버전 `5.0.12` override 및 잠금 파일 갱신 |

의존성 권고: [재귀로 인한 DoS](https://github.com/advisories/GHSA-qhr7-859c-m2p7), [쉼표 파싱 DoS](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p), [확장 연산 DoS](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr).

검증 결과:

- `pnpm test`: 보안 회귀 테스트 13개 통과.
- `pnpm typecheck` 및 Git diff 검사 통과.
- `pnpm audit --prod`: 알려진 취약점 0건 (검사 시점 기준).
- 기존 Git 이력의 텍스트 blob 126개에서 비밀 키·GitHub 토큰·AWS 키·JWT 리터럴 패턴 미검출. 실제 `.env`, 자격증명, 서명 키 추적 파일 미검출. 패턴 검사는 모든 비밀정보의 부재를 보장하지 않는다.

남은 확인 사항:

- JWT 서명, API 요청 대상의 소유권, 입력 범위는 백엔드에서 검증해야 한다. 앱의 JWT 디코딩은 서명 검증을 대신하지 않는다.
- 실제 Android의 refresh 쿠키와 운영 API 연동은 별도로 검증해야 한다.
- 서버 저장 후 응답이 유실되면 재시도 시 중복 기록 가능성이 남는다. 완전한 방지는 서버의 멱등성 처리로 해결해야 한다.
- 소유자 정보가 없는 구버전의 미저장 타이머는 계정 간 노출 방지를 위해 복원하지 않는다.
- EAS 프로젝트와 서명 키는 기존 Expo 계정 설정을 사용한다. GitHub 저장소 변경만으로 Expo 소유권이 이전되지는 않는다.
- 기존 APK는 이번 검토에서 수정한 소스를 포함하지 않으며, 반영하려면 APK를 다시 빌드해야 한다.

## 이전 의존성 감사

2026-09-16 `pnpm audit --prod` 결과:

- `uuid`, `decode-uri-component` 간접 의존성은 안전 버전 override 적용
- Expo/Metro 도구 체인의 `image-size` DoS 권고 2건은 `2.0.3` override로 조치
- 앱은 Android 내부 시연용으로 제한하고 운영 빌드의 평문 HTTP 및 데모 인증을 차단
- 액세스 토큰과 타이머 복원 데이터는 Android Keystore 기반 SecureStore에 저장

Expo SDK 또는 `image-size` 수정 버전이 배포되면 다음 명령으로 다시 확인한다.

```bash
pnpm update
pnpm audit --prod
pnpm dlx expo-doctor
```
