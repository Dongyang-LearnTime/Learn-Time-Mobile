# Security notes

## 저장소에 포함하지 않는 파일

- `.env`, `.env.*` (`.env.example`만 예외)
- `node_modules`, `.expo`, `dist`, `web-build`
- Android/iOS 생성 폴더
- 서명 키와 인증서(`*.jks`, `*.p8`, `*.p12`, `*.key`, `*.pem`, `*.mobileprovision`)
- Firebase/서비스 계정 설정과 자격증명 JSON

실제 비밀값은 Git에 커밋하지 않는다. 저장소에는 공개 가능한 변수 이름과 예시만 `.env.example`로 제공한다.

## 의존성 감사

2026-09-02 `pnpm audit --prod` 결과:

- `uuid`, `decode-uri-component` 간접 의존성은 안전 버전 override 적용
- Expo/Metro 도구 체인의 `image-size@2.0.2` DoS 권고 2건 잔존
- 권고가 요구하는 `image-size@2.0.3`은 검사 시점 npm 레지스트리에 존재하지 않아 적용 불가
- 앱은 사용자가 제공한 ICNS/JXL/HEIF 이미지를 서버에서 파싱하지 않으므로 직접 공격 표면은 제한적임

Expo SDK 또는 `image-size` 수정 버전이 배포되면 다음 명령으로 다시 확인한다.

```bash
pnpm update
pnpm audit --prod
pnpm dlx expo-doctor
```
