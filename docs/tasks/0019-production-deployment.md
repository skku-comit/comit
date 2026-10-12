# Production Deployment

## Goal

현재 웹·관리자 앱을 Vercel, API를 Cloudtype에 배포할 수 있도록 준비한다.
Cloudflare에서 관리하는 `skkucomit.com`, `admin.skkucomit.com`을 연결한다.

## Context

- pnpm 12.3.4 / Turborepo 모노레포이며 로컬은 Node 26.8.1을 사용한다.
- Vercel 공식 지원 런타임은 Node 24 / 22로, 기존 Node 26 전용 engines와 충돌한다.
- Next.js 서버가 API를 프록시하므로 API에는 Cloudtype의 공개 HTTPS 주소를 사용한다.
- Supabase DB·Auth 설정은 `docs/user-management-setup.md`의 기존 구성을 유지한다.
- 배포 플랫폼 프로젝트는 아직 생성하지 않았다.

## Scope

### apps/web / apps/admin

Vercel 프로젝트별 빌드, 환경 변수, 도메인 및 OAuth 설정 안내.

### apps/api

환경 변수로 수신 인터페이스 설정. 저장소 루트 Dockerfile로 빌드·마이그레이션·실행.

### 루트 / docs

Node 24 호환 engines 범위, Docker 빌드 제외 목록, 배포 안내 및 README 링크.

## Requirements

- Vercel 프로젝트를 앱별로 나누고 공유 패키지를 포함한다.
- 로컬 Node 26.8.1을 유지하면서 Vercel Node 24 설치를 허용한다.
- API는 컨테이너에서 `0.0.0.0:3002`로 수신하고 로컬 기본값을 유지한다.
- 운영 비밀 값을 이미지나 저장소에 포함하지 않는다.
- API 시작 전 `prisma migrate deploy`를 실행하고 실패하면 시작하지 않는다.
- Cloudflare DNS는 각 Vercel 프로젝트가 안내하는 값을 사용한다.

## Constraints

- 서비스 기능과 DB 스키마를 변경하지 않는다.
- 계정 로그인과 실제 플랫폼 설정이 필요한 항목은 배포 준비와 구분해 기록한다.
- 실제 운영 DB에 테스트를 실행하지 않는다.

## Acceptance Criteria

- [x] Dockerfile과 제외 목록이 준비되었다.
- [x] API 외부 수신 설정을 검증했다.
- [x] 관련 lint, typecheck, test, build 결과를 기록했다.
- [x] Vercel·Cloudtype·Cloudflare·Supabase 설정 안내가 준비되었다.
- [x] 실제 배포·DNS·OAuth 확인 결과와 미검증 항목을 명시했다.

## Verification

2026-10-12 배포 준비 검증 결과:

- Node 24.13.0에서 web / admin 운영 빌드 통과. 두 빌드에 포함된 TypeScript 검사 통과.
- web / admin / api lint 통과. api 별도 typecheck 통과.
- Node 26.8.1에서 `HOST=0.0.0.0 pnpm --filter @comit/api test`: 5개 통과, 3개 건너뜀. 테스트 DB 미설정으로 PostgreSQL 통합 테스트는 실행하지 않았다.
- 변경된 TS / JSON / Markdown의 Prettier 검사와 `git diff --check` 통과.
- Docker Linux arm64 환경에서 pnpm 12.3.4 frozen-lockfile 설치와 Prisma Client 생성, NestJS 빌드 통과. 빌드 컨텍스트에서 로컬 환경 변수 파일 제외.
- Docker 최종 이미지 생성은 로컬 Docker BuildKit metadata DB 쓰기의 I/O 오류로 중단되었다. 이후 호스트 디스크 부족(`ENOSPC`)도 확인되어 웹 빌드 산출물을 정리했다. 최종 이미지 실행, 시작 시 마이그레이션, Cloudtype의 실제 CPU 아키텍처 환경은 미검증이다.
- 처음 시도한 HTTP 테스트·Turbopack 빌드는 샌드박스 포트 제한으로 실패했으며, 제한을 해제한 환경에서 재검증해 통과했다.
- Vercel CLI 계정 연결을 확인했다. 배포 프로젝트 생성, GitHub 업로드, 실제 Vercel / Cloudtype 배포, DNS 연결, 실제 Supabase / Google OAuth 확인은 아직 수행하지 않았다.

## Deployment Follow-up

1. 배포 준비 변경을 GitHub에 올린다.
2. Cloudtype 서비스를 생성하고 런타임 환경 변수를 등록해 API를 배포한다.
3. 발급된 API HTTPS 주소로 web / admin Vercel 프로젝트를 설정하고 배포한다.
4. Cloudflare DNS와 Supabase callback 주소를 설정한 뒤 운영 확인 목록을 수행한다.

실행 순서와 설정값은 `docs/deployment.md`를 따른다.
