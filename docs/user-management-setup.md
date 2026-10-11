# 부원 관리 실행 및 운영 설정

## DB 준비

API는 Prisma 6.19를 사용한다. 기존 NestJS CommonJS 구성에 맞춰 Prisma CLI와 Client를 같은 버전으로 유지한다. 서비스 데이터는 `comit` 스키마에 저장하며 Supabase Auth의 테이블을 수정하지 않는다.

Supabase SQL Editor에서 전용 DB 계정과 스키마를 준비한다. 아래 비밀번호는 반드시 별도 비밀 값으로 바꾼다.

```sql
CREATE ROLE comit_api LOGIN PASSWORD 'REPLACE_WITH_STRONG_PASSWORD';
GRANT comit_api TO postgres;
CREATE SCHEMA comit AUTHORIZATION comit_api;
REVOKE ALL ON SCHEMA comit FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA comit TO comit_api;
```

Supabase Connect의 Direct connection 주소를 API의 `.env`에 설정한다. 비밀번호에 특수 문자가 있으면 URL 인코딩한다. 직접 연결은 기본적으로 IPv6이므로 실행 서버의 연결 가능 여부를 확인한다. IPv4 전용 로컬 환경에서는 Connect의 Session pooler(5432)를 사용할 수 있다. 사용자명은 `comit_api.<project-ref>`이고 `DATABASE_URL`과 `DIRECT_DATABASE_URL` 모두 Session pooler 주소를 사용한다. 직접 연결을 유지하려면 IPv6 네트워크 또는 유료 IPv4 옵션이 필요하다. [Supabase 연결 안내](https://supabase.com/docs/guides/database/connecting-to-postgres)

```sh
cp apps/api/.env.example apps/api/.env
pnpm --filter @comit/api db:generate
pnpm --filter @comit/api db:deploy
```

- `DATABASE_URL`: API 런타임 직접 연결 주소. `schema=comit&sslmode=require`를 지정한다.
- `DIRECT_DATABASE_URL`: 마이그레이션 직접 연결 주소. 첫 구성에서는 같은 주소를 사용할 수 있다.
- `db:deploy`: 저장소의 마이그레이션 적용. 운영에서는 이 명령을 사용한다.
- `db:migrate`: 개발 DB에서만 새 마이그레이션 작성. 전용 shadow DB 또는 스키마 생성 권한을 별도로 준비한다.
- Supabase Data API의 exposed schemas에 `comit`을 추가하지 않는다. anon/authenticated 역할에 서비스 스키마 접근 권한을 부여하지 않는다.

## Google 로그인

1. Google Cloud OAuth 클라이언트를 만들고 Supabase Auth의 Google provider를 설정한다. Supabase가 표시하는 callback URL을 Google의 승인된 redirect URI에 등록한다.
2. Supabase Auth URL Configuration에 사용자·관리자 앱의 `/auth/callback` URL을 등록한다. 개발 주소는 `http://localhost:3000/auth/callback`, `http://localhost:3001/auth/callback`이다. 운영 주소도 각각 등록한다.
3. 두 웹 앱에 `.env.example`을 복사해 `.env.local`을 만든다. Supabase URL·publishable key, 각 앱의 `SITE_URL`, 내부 `API_URL`을 설정한다.
4. API `.env`에 동일 프로젝트의 `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`를 설정한다. `ADMIN_EMAILS`는 학교 관리자 이메일을 쉼표로 구분한다. 비어 있으면 관리자 권한을 가진 사용자가 없다.
5. `pnpm dev`로 실행한다. API는 localhost에 바인딩되므로 운영 배포에서는 Next.js 서버가 접근 가능한 내부 주소/네트워크 구성을 준비한다.

학교 Google 계정과 확인된 이메일을 서버에서 검사한다. 허용 도메인은 `g.skku.edu`, `skku.edu`다. 웹 쿠키의 세션 토큰은 Next.js 서버에서 API로 전달하며, API는 Supabase Auth에 토큰을 검증한다. DB 비밀번호와 관리자 이메일 설정은 브라우저에 전달하지 않는다. Google 로그인 성공 여부만으로 관리자 접근을 허용하지 않는다.

## 첫 운영 순서

1. 관리자에서 과거 학기를 만들고 이메일 없는 기존 부원을 수동 등록한다. 과거 승인 이력을 시간 순서대로 등록한다. 과거 이력은 동의·회비 정보를 지어내지 않고 수동 등록 기록으로 남긴다.
2. 새 운영 학기에 신규·재등록 각각의 모집 기간과 회비, 공통 계좌를 입력한다. 한국 시간으로 입력·표시한다. 시작 시각은 포함하고 종료 시각은 제외한다.
3. 운영진이 확정한 개인정보 동의문과 버전을 입력한다. 동의문을 변경할 때는 버전도 변경한다. 저장 후 현재 학기로 선택하고 모집을 연다.
4. 기존 명부와 학번이 일치하는 신청은 운영진이 신원을 확인하고 계정을 연결한다. 신청자에게는 확인 전 기존 개인 정보가 표시되지 않는다.
5. 입금을 확인하고 승인한다. 보완·반려 사유와 처리자·시각은 이력에 남는다. 승인·반려 후 본인 수정, 승인 후 입금 확인 취소는 허용하지 않는다.

모집 종료 후 기존 신청의 보완과 재제출은 가능하다. 학번 변경은 관리자 문의로 처리한다. 승인 여부는 학기별 정보이므로 다음 학기에도 새 신청이 필요하다. 졸업·휴학·기타 자격은 관리자가 심사한다.

## API 계약

모든 보호 API는 Supabase access token을 `Authorization: Bearer`로 받는다. 관리자 목록은 페이지당 20건이다. 상태 충돌·중복·동시 처리에는 409를 반환하므로 화면을 새로 불러온 뒤 처리한다.

| 경로                                                        | 용도                            |
| ----------------------------------------------------------- | ------------------------------- |
| `GET /users/me`                                             | 본인 연결 정보와 관리자 여부    |
| `GET /users`, `POST /users`, `PATCH /users/:id`             | 관리자 명부 검색·등록·수정      |
| `GET /users/:id/memberships`                                | 관리자 사용자별 등록 이력       |
| `GET /semesters/current`                                    | 현재 학기 설정                  |
| `GET /semesters`, `POST /semesters`, `PATCH /semesters/:id` | 관리자 학기 설정                |
| `POST /semesters/:id/activate`                              | 현재 운영 학기 선택             |
| `GET /memberships/me`                                       | 본인 신청·연결된 과거 이력      |
| `POST /memberships`, `PATCH /memberships/:id`               | 신청·수정·재제출                |
| `GET /memberships`, `GET /memberships/:id`                  | 관리자 신청 검색·상세·처리 이력 |
| `POST /memberships/:id/actions`                             | 계정 연결·입금·승인·보완·반려   |
| `POST /memberships/historical`                              | 관리자 과거 승인 이력 등록      |

요청·응답 타입은 `@comit/contracts`에서 제공한다. 상태 변경에는 상세 응답의 `version`을 제출한다. 학번 연결과 입금 확인이 완료되어야 승인할 수 있다. 신청의 개인 정보·회비·동의문은 스냅샷으로 보존한다.

## 테스트

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

실제 PostgreSQL 검증에는 **운영과 분리된 빈 테스트 DB**를 준비하고 같은 마이그레이션을 적용한다. 통합 테스트는 현재 학기를 변경하므로 운영 DB에서 실행하지 않는다. `TEST_DATABASE_URL`이 없으면 통합 테스트는 건너뛰며, 운영 `DATABASE_URL`을 대신 사용하지 않는다.

```sh
DATABASE_URL="$TEST_DATABASE_URL" DIRECT_DATABASE_URL="$TEST_DATABASE_URL" pnpm --filter @comit/api db:deploy
pnpm --filter @comit/api test:integration
```

Google 인증 테스트는 테스트용 Auth HTTP 응답으로 토큰 거부·학교 도메인·Google provider·관리자 판정을 검사한다. 실제 Google OAuth와 실제 Supabase 프로젝트는 별도 연동 확인이 필요하다.
