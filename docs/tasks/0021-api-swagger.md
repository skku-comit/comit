# API Swagger 문서

## Goal

기존 백엔드 API의 요청·응답·인증 요구사항을 Swagger UI에서 확인하고 실행한다.

## Context

`apps/api`는 NestJS 11을 사용하며 요청 본문은 Zod로 검증한다. 기존 컨트롤러에는 OpenAPI 메타데이터가 없어 인터페이스와 구현을 직접 읽어야 한다.

## Scope

### apps/api

Swagger 설정, 기존 API 문서 메타데이터, HTTP 문서 검증.

### 문서

README 실행 안내와 작업 문서.

## Requirements

- `/docs`에서 Swagger UI, `/docs-json`에서 OpenAPI JSON을 제공한다.
- 부원·학기·가입 신청·스터디 API를 그룹화하고 요청 본문·쿼리·UUID 경로 매개변수·응답을 문서화한다.
- Supabase Bearer 인증을 설정하고 공개·인증·관리자 API를 구분한다.
- Zod 검증 스키마를 재사용하고 조건부 필수 필드 등 추가 검증은 설명에 기재한다.

## Constraints

- 기존 API의 경로, 권한, 검증 및 응답 동작을 변경하지 않는다.
- 데이터베이스나 외부 인증 서비스 없이 문서 검증이 가능해야 한다.

## Acceptance Criteria

- [x] Swagger UI와 OpenAPI JSON이 정상 응답한다.
- [x] 기존 모든 API 경로가 문서에 포함되고 인증 요구사항이 실제 구현과 일치한다.
- [x] 요청·응답·필터·UUID 매개변수가 문서에 포함된다.
- [x] API lint, typecheck, build 및 테스트를 통과한다.

## Validation

- API lint, typecheck, build 통과.
- HTTP 테스트로 Swagger UI·JS 리소스·JSON 문서, 30개 작업의 요청·응답·경로·권한 메타데이터, 기존 인증 가드 검증.
- API 테스트 5개 통과. `TEST_DATABASE_URL`이 필요한 통합 테스트 3개는 설정 부재로 건너뜀.
