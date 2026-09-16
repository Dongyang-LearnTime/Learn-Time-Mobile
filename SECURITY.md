# Security notes

## 저장소에 포함하지 않는 파일

- `.env`, `.env.*` (`.env.example`만 예외)
- `node_modules`, `.expo`, `dist`, `web-build`
- Android/iOS 생성 폴더
- 서명 키와 인증서(`*.jks`, `*.p8`, `*.p12`, `*.key`, `*.pem`, `*.mobileprovision`)
- Firebase/서비스 계정 설정과 자격증명 JSON

실제 비밀값은 Git에 커밋하지 않는다. 저장소에는 공개 가능한 변수 이름과 예시만 `.env.example`로 제공한다.

## 의존성 감사

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
