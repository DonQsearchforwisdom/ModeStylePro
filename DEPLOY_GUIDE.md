# ModeStyle Pro - 배포 및 실행 가이드 (Deploy & Run Guide)

이 문서는 ModeStyle Pro 프로젝트의 **정식 소셜 로그인**, **Vercel Postgres 클라우드 DB 연동**, 그리고 **개발자용 테스트 로그인**의 세팅 및 실행 방법을 언제든 꺼내 보실 수 있도록 정리한 가이드북입니다.

---

## 1. 🧪 로컬 개발 환경 및 테스트 로그인 방법

로컬에서 실제 구글/카카오 API 키를 발급받지 않고도 데이터베이스(DB) 및 결제 연동 작동을 100% 동일하게 확인하기 위해 제공되는 개발자용 로그인 채널입니다.

### 실행 방법
1. 프로젝트 루트 경로의 터미널에서 개발 서버 실행:
   ```bash
   npm run dev
   ```
2. 웹 브라우저로 `http://localhost:3000` 접속.
3. 우측 상단 **[로그인]** 단추 클릭.
4. 모달 창 최상단의 **[🧪 개발자용 1초 간편 로그인 (테스트용)]** 버튼 클릭.
5. **결과**: `test-XXXXX@modestyle.pro` 계정이 로컬 SQLite DB(`prisma/dev.db`)에 즉시 자동 가입되며, 가상 크레딧 **30회**가 자동 지급되어 실시간 차감 및 결제 합산 흐름을 테스트하실 수 있습니다.

---

## 2. 💾 Vercel Postgres (클라우드 DB) 연동 방법

실제 사이트를 Vercel에 배포했을 때 회원 정보와 남은 크레딧 횟수가 리셋되지 않도록 방지하는 클라우드 DB 연동법입니다.

### 설정 순서
1. **Vercel 콘솔 접속**: [Vercel Dashboard](https://vercel.com)에 로그인 후 해당 프로젝트를 선택합니다.
2. **Storage 탭 이동**: 상단 메뉴 중 **[Storage]** 탭을 클릭합니다.
3. **Postgres 생성**: **[Connect Database]** ➡️ **[Postgres]** ➡️ **[Create]**를 차례로 클릭해 데이터베이스를 신설합니다.
4. **자동 환경변수 바인딩**: 생성이 완료되면 Vercel이 프로젝트 환경변수에 `POSTGRES_PRISMA_URL` 및 `POSTGRES_URL_NON_POOLING`을 자동으로 알아서 등록해 줍니다.
5. **재배포**: 프로젝트를 다시 배포(Redeploy)하면, 서버리스 리눅스 컨테이너 상에서 완벽한 영구 크레딧 데이터 연동이 실현됩니다.

---

## 3. 🔑 정식 소셜 로그인 API 키 연동 (실제 출시 단계)

실제 구글, 네이버, 카카오 소셜 로그인이 정상 작동하기 위해 발급받은 정식 API 키를 환경변수에 선언하는 방법입니다.

### 환경변수 등록 대상 (Vercel Settings 또는 .env.local)
각 플랫폼 개발자 센터에 웹사이트 주소(예: `https://your-domain.vercel.app`)를 등록하고 발급받은 클라이언트 아이디와 비밀번호를 환경변수에 등록해 주셔야 동작합니다.

- **구글 로그인 (Google Cloud Console)**
  - `AUTH_GOOGLE_ID` = 구글 클라이언트 ID
  - `AUTH_GOOGLE_SECRET` = 구글 클라이언트 시크릿
- **네이버 로그인 (Naver Developers)**
  - `AUTH_NAVER_ID` = 네이버 Client ID
  - `AUTH_NAVER_SECRET` = 네이버 Client Secret
- **카카오 로그인 (Kakao Developers)**
  - `AUTH_KAKAO_ID` = 카카오 REST API 키
  - `AUTH_KAKAO_SECRET` = 카카오 Client Secret (보안 설정에서 활성화한 경우만 필수)
- **공통 세션 암호화 키**
  - `AUTH_SECRET` = `f6c8d76d47d0e49a038bf3b8cd9a7791` (임의의 32자리 고유 문자열)
