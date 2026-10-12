# 브라우저의 API 직접 호출

## Goal

web·admin의 브라우저 요청을 api.skkucomit.com에 직접 보내고 Next.js 프록시와 인증 Route Handler를 제거한다.

## Context

0023에서 Supabase 인증을 API로 이전했다. 프론트에 남은 쿠키 전달과 프록시를 제거하고 API가 로그인부터 세션 쿠키까지 관리하도록 통합한다.

## Scope

### apps/web / apps/admin

공개 API 주소로 credentials: include 요청을 보내고 API 로그인·로그아웃 경로를 사용한다. 프록시·인증 Route Handler·세션 도우미를 제거한다.

### apps/api

API 호스트 전용 HttpOnly 쿠키, 학교 Google OAuth 콜백, CORS, 변경 요청 Origin 검사, 세션 갱신·로그아웃을 처리한다.

### 공유 설정과 문서

프론트 NEXT_PUBLIC_API_URL, API API_PUBLIC_URL, 허용 origin과 Supabase callback·DNS 설정을 안내한다.

## Requirements

- 브라우저의 데이터·인증 요청이 API 도메인으로 직접 전송된다.
- 쿠키는 API 호스트만 사용하고 HttpOnly·SameSite=Lax, 운영 HTTPS에서는 Secure·__Host- 접두사를 적용한다.
- web·admin 세션을 origin별로 구분하고 학교 계정·관리자 검증을 유지한다.
- CORS는 명시적으로 허용한 origin과 credentials만 허용한다. 상태 변경 요청에 Origin 검사를 적용한다.
- PKCE 대기 상태는 API 쿠키에 저장하고 API 콜백에서 교환한다. 토큰·세션을 JSON 응답이나 브라우저 저장소에 노출하지 않는다.
- 기존 Bearer 인증·공개 스터디 조회·401 로그인 이동을 유지한다.

## Constraints

DB·업무 로직은 변경하지 않는다. 운영 환경은 같은 site의 세 도메인을 사용하며 로컬 개발에서도 localhost 호스트를 통일한다. 운영 배포는 별도이다.

## Acceptance Criteria

- [x] Next.js 프록시·인증 처리와 이전 경로 참조를 제거한다.
- [x] 쿠키 인증·갱신·로그아웃·CORS·Origin·PKCE·권한 테스트를 통과한다.
- [x] API·web·admin lint·typecheck·build와 테스트를 통과한다.
- [x] 도메인·환경 변수·Supabase callback 변경을 문서화한다.

## Verification

2026-10-12.

- API·web·admin lint·typecheck·build 통과. 전체 format:check와 git diff --check 통과.
- API 테스트 8개 통과. TEST_DATABASE_URL이 없어 DB 통합 테스트 3개는 건너뛰었다.
- 실제 NestJS HTTP와 모의 Auth 서버로 API OAuth 리디렉션·PKCE·쿠키 속성·학교 계정 제한·origin별 세션 분리·세션 갱신·로그아웃·CORS preflight·변경 요청 Origin 검사를 검증했다. 만료·위변조·비허용 origin·이전 세션 헤더 방식도 차단했다.
- 두 프론트의 실제 API 도우미를 실행해 공개 API URL, credentials: include, JSON 요청, 401 로그인 이동 및 선택적 조회 제외, 403 처리를 검사했다.
- Playwright와 실제 프로덕션 web·admin 빌드, 모의 Auth 서버로 로그인·콜백·계정 조회·로그아웃을 확인했다. 데이터 요청은 localhost:3002로 직접 전송된다. HttpOnly·SameSite=Lax 쿠키가 origin별로 분리되고 admin 로그아웃 후 web 세션이 유지된다. 비허용 localhost origin의 브라우저 요청은 CORS로 차단된다. HTTPS용 Secure·__Host-·Domain 미지정은 HTTP 테스트로 검사했다.
- 브라우저 검증에서 내 정보·관리자 로그아웃 버튼의 기본 type이 button이라 제출되지 않던 문제를 발견하고 submit을 지정했다. 수정 후 두 앱의 실제 API POST 및 로그인 화면 복귀를 확인했다.
- Next.js 빌드에서 API 프록시·인증 경로가 제거됐고, 프론트의 Supabase 및 이전 프록시 참조가 없음을 확인했다. 로컬 환경 파일은 공개 API URL과 localhost 호스트로 통일했다.
- 운영 DNS·Cloudtype·Vercel·실제 Google OAuth·운영 DB는 변경하거나 검증하지 않았다. API_PUBLIC_URL, NEXT_PUBLIC_API_URL, API 도메인·HTTPS와 Supabase API 콜백 패턴 설정 후 재배포해야 한다. 자세한 순서는 deployment.md에 기록했다.
