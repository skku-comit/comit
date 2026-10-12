# 운영 배포 안내

## 구성

| 서비스    | 배포 플랫폼                   | 운영 주소                       |
| --------- | ----------------------------- | ------------------------------- |
| web       | Vercel 프로젝트 `comit-web`   | `https://skkucomit.com`         |
| admin     | Vercel 프로젝트 `comit-admin` | `https://admin.skkucomit.com`   |
| api       | Cloudtype Dockerfile 서비스   | Cloudtype에서 발급한 HTTPS 주소 |
| DB / Auth | 기존 Supabase 프로젝트        | 기존 프로젝트 유지              |

프로젝트 이름은 권장값이다. 웹·관리자 앱은 같은 GitHub 저장소를 각각 연결한다.
브라우저 → 같은 도메인의 Next.js `/api/backend/*` → Cloudtype API 순서로 요청한다.
`API_URL`은 서버 전용 환경 변수다. 별도의 `api.skkucomit.com` 연결이나 브라우저 CORS 허용 목록은 현재 구조에서 필요하지 않다.

## 1. 배포 코드 준비

이 문서와 루트 `Dockerfile`을 포함한 변경 사항을 배포할 GitHub 브랜치에 올린다.
두 플랫폼에서 같은 브랜치를 선택한다. 로컬 변경만으로는 GitHub 연동 배포에 반영되지 않는다.

로컬 Node 버전은 `.node-version`의 26.8.1, Cloudtype 이미지도 26.8.1을 사용한다.
Vercel은 현재 Node 24 / 22를 지원하므로 두 프론트 프로젝트에서 **24.x**를 선택한다.
루트 `engines.node`는 Node 24 이상 27 미만을 허용한다. pnpm은 모든 환경에서 **12.3.4**다.
[Vercel 지원 런타임](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)

## 2. Cloudtype API

1. 새 프로젝트에서 GitHub 저장소와 브랜치를 연결하고 **Dockerfile** 템플릿을 선택한다.
2. 빌드 컨텍스트는 **저장소 루트**로 유지한다. 서브 디렉터리에 `apps/api`를 지정하면 공유 패키지와 lockfile이 빠진다.
3. 루트 `Dockerfile`을 사용한다. Dockerfile 내용 입력 방식이라면 해당 파일 내용을 그대로 입력한다.
4. HTTP 대상 포트는 **3002**, Health Check 경로는 **/**로 설정한다. 이 경로는 프로세스 응답만 확인하며 DB 연결 상태는 검사하지 않는다.
5. 시작 명령은 Dockerfile의 CMD를 사용하도록 별도 덮어쓰기를 비운다.
6. 다음 환경 변수를 서비스의 런타임 환경 변수로 등록하고 배포한다.

| 변수                       | 값                                               |
| -------------------------- | ------------------------------------------------ |
| `NODE_ENV`                 | `production` (이미지 기본값)                     |
| `HOST`                     | `0.0.0.0` (이미지 기본값)                        |
| `PORT`                     | `3002` (이미지 기본값)                           |
| `DATABASE_URL`             | 기존 Supabase 서비스 DB 접속 URL                 |
| `DIRECT_DATABASE_URL`      | 마이그레이션용 DB 접속 URL                       |
| `SUPABASE_URL`             | `https://<project-ref>.supabase.co`              |
| `SUPABASE_PUBLISHABLE_KEY` | 기존 프로젝트 publishable key                    |
| `ADMIN_EMAILS`             | 실제 관리자 학교 이메일, 여러 명이면 쉼표로 구분 |

DB URL에는 `schema=comit&sslmode=require`를 포함한다. Cloudtype에서 직접 연결의 IPv6 주소에 접근할 수 없다면 Supabase **Session pooler(5432)**를 사용한다. 사용자명은 `comit_api.<project-ref>`다. 기존 전용 계정·스키마 준비와 상세 연결 설정은 [부원 관리 실행 안내](user-management-setup.md)를 따른다.

컨테이너는 시작할 때 `prisma migrate deploy`로 저장소의 마이그레이션을 적용하고 성공한 뒤 API를 실행한다. 처음에는 레플리카 1개로 시작한다. DB 비밀번호 등은 **Build arguments가 아닌 런타임 환경 변수**로 입력한다. `.dockerignore`가 로컬 `.env`와 `.env.local`을 빌드 컨텍스트에서 제외한다.

Prisma·Nest CLI는 설치된 파일을 Node로 직접 실행한다. 컨테이너에서 `pnpm run`을 사용하면 pnpm의 의존성 확인 기능이 전체 workspace 설치를 다시 시작할 수 있기 때문이다. 실행 로그에 `Scope: all 6 workspace projects`와 Next.js·Storybook 다운로드가 나타나면 수정된 Dockerfile이 반영됐는지 확인한다. 이 변경은 기존 이미지의 재시작만으로 적용되지 않으며, GitHub에 수정된 Dockerfile을 올린 뒤 Cloudtype에서 새 이미지를 빌드하는 재배포가 필요하다.

Cloudtype에서 발급한 HTTPS 주소를 복사한다. 해당 주소의 `/`에 접근하면 다음 응답이 나와야 한다.

```json
{ "message": "comit API" }
```

Docker를 사용할 수 있는 환경에서는 이미지 자체를 먼저 확인할 수 있다.

```sh
docker build -t comit-api .
# 실제 DB 설정으로 시작하면 운영 마이그레이션이 실행된다.
docker run --rm --env-file apps/api/.env -e HOST=0.0.0.0 -p 3002:3002 comit-api
```

[Cloudtype Dockerfile 배포 공식 안내](https://docs.cloudtype.dev/ko/developers/dockerfile)

## 3. Vercel web / admin

같은 저장소로 프로젝트를 두 개 생성하고 다음 값을 설정한다.

| 설정             | web                              | admin                              |
| ---------------- | -------------------------------- | ---------------------------------- |
| Root Directory   | `apps/web`                       | `apps/admin`                       |
| Framework Preset | Next.js                          | Next.js                            |
| Node.js Version  | `24.x`                           | `24.x`                             |
| Build Command    | `pnpm --filter @comit/web build` | `pnpm --filter @comit/admin build` |
| Install Command  | `pnpm install --frozen-lockfile` | `pnpm install --frozen-lockfile`   |
| Output Directory | Next.js 기본값                   | Next.js 기본값                     |

Root Directory 설정의 **Include source files outside of the Root Directory in the Build Step**을 활성화해서 `packages/ui`와 `packages/contracts`를 포함한다.
루트의 `packageManager` 버전을 사용하도록 두 프로젝트에 `ENABLE_EXPERIMENTAL_COREPACK=1`을 설정한다. 설치 로그에서 pnpm 12.3.4인지 확인한다.
[모노레포 설정](https://vercel.com/docs/monorepos/monorepo-faq), [패키지 관리자 설정](https://vercel.com/docs/package-managers)

각 프로젝트의 **Production** 환경에 아래 값을 등록한다.

| 변수                                   | web                                 | admin                         |
| -------------------------------------- | ----------------------------------- | ----------------------------- |
| `ENABLE_EXPERIMENTAL_COREPACK`         | `1`                                 | `1`                           |
| `NEXT_PUBLIC_SUPABASE_URL`             | 기존 Supabase URL                   | 동일                          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 기존 publishable key                | 동일                          |
| `SITE_URL`                             | `https://skkucomit.com`             | `https://admin.skkucomit.com` |
| `API_URL`                              | Cloudtype HTTPS 주소, 끝의 `/` 제외 | 동일                          |

`NEXT_PUBLIC_*`는 빌드 결과에 포함되므로 변경 후 재배포해야 한다. 환경 변수 설정을 바꾸면 새 배포를 실행한다.
Production의 `SITE_URL`로는 도메인 연결 후 로그인·POST 요청을 확인한다. 임시 `*.vercel.app` 주소에서는 리디렉션·Origin 검사가 운영 도메인을 기준으로 동작한다.
Preview에서 로그인을 검증하려면 별도의 고정 테스트 도메인, 해당 `SITE_URL`, Supabase callback 허용 URL을 설정한다.

## 4. Cloudflare 도메인 연결

1. Vercel web 프로젝트의 Settings → Domains에 `skkucomit.com`을 추가한다.
2. Vercel admin 프로젝트의 Settings → Domains에 `admin.skkucomit.com`을 추가한다.
3. Cloudflare의 해당 도메인 DNS → Records에 Vercel 화면이 안내하는 레코드를 입력한다.

| Cloudflare 이름 | 타입                                      | 대상                         |
| --------------- | ----------------------------------------- | ---------------------------- |
| `@`             | Vercel이 안내하는 타입 (일반적으로 A)     | web 프로젝트가 안내하는 값   |
| `admin`         | Vercel이 안내하는 타입 (일반적으로 CNAME) | admin 프로젝트가 안내하는 값 |

같은 이름의 충돌하는 A/AAAA/CNAME이 있다면 내용을 확인하고 교체한다. MX 등 메일 관련 레코드는 유지한다. 소유권 확인용 TXT를 요구하면 안내값을 추가한다.
두 서비스 레코드의 Proxy status는 **DNS only(회색 구름)**로 설정한다. Cloudflare에서 도메인과 DNS를 계속 관리하고 Vercel에서 HTTPS 인증서를 발급한다.
IP나 CNAME을 예전 공통값으로 추측하지 말고 각 프로젝트의 Domains 화면에 표시된 값을 사용한다.
Vercel에 Valid Configuration이 표시되고 두 주소에서 HTTPS 접속이 되는지 확인한다.
[Vercel 도메인 연결](https://vercel.com/docs/domains/working-with-domains/add-a-domain), [Cloudflare와 Vercel 구성](https://vercel.com/kb/guide/cloudflare-with-vercel)

## 5. Supabase 로그인 주소

기존 Supabase 프로젝트의 Authentication → URL Configuration에서 설정한다.

- Site URL: `https://skkucomit.com`
- Redirect URLs: `https://skkucomit.com/auth/callback`
- Redirect URLs: `https://admin.skkucomit.com/auth/callback`
- 개발을 계속한다면 기존 localhost callback URL도 유지한다.

Google OAuth 클라이언트의 승인된 redirect URI는 앱 주소가 아니라 Supabase가 안내하는 `https://<project-ref>.supabase.co/auth/v1/callback`이다. 같은 Supabase 프로젝트를 사용한다면 기존 설정을 유지한다.

## 6. 운영 확인

- [ ] Cloudtype API `/` 응답과 마이그레이션 성공 로그 확인.
- [ ] 두 Vercel 빌드 성공 및 Cloudflare DNS / HTTPS 확인.
- [ ] 웹에서 학교 Google 계정으로 로그인·로그아웃.
- [ ] 관리자 계정으로 관리자 페이지 로그인, 일반 계정의 관리자 접근 거부 확인.
- [ ] 웹 스터디 조회와 관리자 목록 조회로 DB·API 연결 확인.
- [ ] 모집 설정이 있는 경우 가입·수정 요청이 Origin 검사에 막히지 않는지 확인.

빌드와 단위 테스트가 통과해도 실제 DNS·Cloudtype 네트워크·Google OAuth 검증을 대신하지 않는다.
현재 task의 검증 결과는 [0019-production-deployment.md](tasks/0019-production-deployment.md)에 기록한다.
