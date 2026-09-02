# LearnTime Mobile

LearnTime 웹/백엔드와 같은 계정 및 데이터를 사용하는 시연용 모바일 컴패니언 앱을 위한 폴더입니다.

개발 범위, 기술 결정, API 계약, 체크리스트와 재개 절차는 [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)를 기준으로 관리합니다.

## 시작하기

```bash
cp .env.example .env
# .env의 서버 주소를 실제 백엔드 주소로 수정
pnpm install
pnpm start
```

백엔드가 중지된 동안 화면만 확인하려면 `.env`에 다음 값을 설정합니다.

```dotenv
EXPO_PUBLIC_DEMO_MODE=true
```

데모 모드는 로그인, 사용자 요약, 오늘 계획, 집중 시간 저장, 체중 기록을 로컬 목업 데이터로 동작시킵니다. 실제 서버 연동 전에는 반드시 `false`로 변경합니다.

실제 안드로이드 휴대폰에 Expo Go를 설치하고 표시된 QR 코드를 스캔합니다. 휴대폰에서 PC의 로컬 서버를 사용할 때 `localhost` 대신 같은 Wi-Fi의 PC 내부 IP를 사용해야 합니다.

## 확인 명령

```bash
pnpm typecheck
pnpm exec expo-doctor
```

APK는 Expo 계정 설정 후 `eas build --platform android --profile preview`로 생성합니다.

민감 파일 제외 기준과 의존성 감사 결과는 [SECURITY.md](./SECURITY.md)를 확인합니다.
