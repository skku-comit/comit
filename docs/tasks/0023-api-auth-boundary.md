# 프론트 인증의 API 서버 통합

## Goal

web·admin에서 Supabase 직접 접근과 설정을 제거하고 인증을 포함한 모든 서비스 요청을 API 서버로 통합한다.

## Context

데이터 요청은 기존 Next.js 프록시를 통해 NestJS·Prisma로 처리하지만 인증과 세션 갱신은 각 프론트의 Supabase SDK에 의존하고 있었다. 기존 학교 Google 계정 제한·관리자 권한·로그인 후 목적지를 유지한다.

## Scope

### apps/web / apps/admin

Supabase SDK·설정·클라이언트를 제거하고 로그인·콜백·로그아웃·데이터 프록시를 API에 연결한다. 헤더 계정은 `/users/me`로 조회한다.

### apps/api

PKCE 로그인 시작·코드 교환·세션 갱신·로그아웃을 처리한다. API 전용 키로 암호화한 세션과 로그인 상태를 발급하고 학교 계정·관리자 권한을 검증한다.

### 공유 설정 및 문서

lockfile·Turborepo 환경 변수·로컬 환경 설정·운영 배포 안내를 갱신한다.

## Requirements

- 프론트 코드·의존성·환경 설정에 Supabase URL·키·SDK가 남지 않는다.
- 브라우저는 동일 origin의 Next.js 경로를 사용하고 Next.js는 API에만 인증 요청을 전송한다.
- 세션과 PKCE 대기 상태는 HttpOnly·SameSite=Lax 쿠키에 저장하고 HTTPS에서는 Secure를 사용한다.
- 세션 암호화 키는 API만 보유하며 세션 위변조·만료·다른 사이트 재사용을 차단한다.
- API는 허용된 사이트 origin만 로그인에 사용하며 기존 Origin 검사와 관리자 인가를 유지한다.
- 기존 Bearer 인증과 공개 스터디 조회를 유지한다.

## Constraints

DB 스키마·업무 로직은 변경하지 않는다. 운영 배포 설정 변경 및 실제 Google OAuth는 별도 연동 검증이 필요하다. 기존 사용자는 새 구조 배포 후 다시 로그인한다.

## Acceptance Criteria

- [x] web·admin의 Supabase 직접 참조·설정·의존성을 제거한다.
- [x] API 인증·갱신·로그아웃 및 위변조·만료·도메인·사이트 제한 테스트를 통과한다.
- [x] API·web·admin lint·typecheck·build와 API 테스트를 통과한다.
- [x] 운영에 필요한 API 세션 키·허용 origin 설정을 문서화한다.

## Verification

2026-10-12.

- API·web·admin lint·typecheck·build 통과. 전체 format:check와 git diff --check 통과.
- API 테스트 8개 통과. TEST_DATABASE_URL이 없어 PostgreSQL·DB HTTP 통합 테스트 3개는 건너뛰었다.
- 로컬 모의 Auth 서버와 실제 NestJS HTTP 요청으로 PKCE challenge·verifier, 코드 교환, 학교 Google 계정·관리자 판정, 세션 갱신·로그아웃을 검증했다. 위변조·만료·다른 origin·잘못된 코드·갱신 실패·설정 누락도 검사했다.
- 두 프론트의 실제 Route Handler와 세션 도우미를 변환해 모의 API 응답으로 로그인·콜백·로그아웃·프록시를 실행했다. HttpOnly·Secure 쿠키, 로그인 대기 상태 삭제, 갱신 쿠키 반영, 401 세션 제거, Origin 검사, 브라우저 Authorization 및 API 세션 응답 헤더 미전달을 확인했다.
- web·admin 소스·환경 파일·의존성과 브라우저 정적 빌드에서 Supabase 참조가 없음을 확인했다. 로컬 프론트 환경에서 Supabase 설정을 제거하고 로컬 API에 세션 키·허용 origin을 추가했다. 비밀 값은 gitignore된 파일에만 보관한다.
- 실제 학교 Google OAuth·운영 DB·Vercel·Cloudtype 배포는 실행하지 않았다. 운영 API에 AUTH_SESSION_SECRET·AUTH_ALLOWED_ORIGINS를 추가하고 프론트의 기존 NEXT_PUBLIC_SUPABASE 설정을 삭제해 재배포해야 한다. 로그인 callback URL은 기존 앱 주소를 유지한다.
