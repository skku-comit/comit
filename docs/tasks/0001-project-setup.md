# Project Setup

## Goal

Codex가 task 문서를 기준으로 일관되게 작업할 수 있는 문서 체계와 실행 가능한 최소 모노레포 개발 환경을 마련한다.

## Context

최초 작업으로 기존 코드는 없다. pnpm과 Turborepo를 사용하며, web/admin은 Next.js, api는 NestJS, 공통 UI는 shadcn/ui를 사용한다.

## Scope

루트 작업 지침·workspace·검증 설정, 앱별 작업 지침, task 템플릿, README 및 아래 초기 환경을 구성한다.

### apps/web

일반 사용자용 Next.js 시작 화면.

### apps/admin

운영자용 Next.js 시작 화면.

### apps/api

NestJS 기본 응답과 테스트.

### packages

공통 shadcn UI 및 생성기가 제공하는 공통 설정.

## Requirements

- 루트와 각 앱의 AGENTS.md, 재사용 가능한 task 템플릿을 구성한다.
- task는 4자리 생성 순서 번호와 결과물 중심 kebab-case 이름을 사용한다.
- shadcn preset `b5cjpD6W2`, Next.js monorepo 템플릿과 pointer 옵션을 적용한다.
- 앱 이름은 @comit/web, @comit/admin, @comit/api, UI는 @comit/ui로 한다.
- Node 24 LTS, pnpm 버전과 lockfile을 기록한다.
- TypeScript strict, Prettier와 import 정렬을 적용한다.
- ~/는 저장소 루트, @/는 각 앱·패키지 루트로 해석한다. 공통 코드는 패키지의 공개 exports로 참조한다.
- 루트 dev/build/lint/typecheck/test/format/format:check 명령을 제공한다.
- 개발 포트는 web 3000, admin 3001, api 3002로 한다.

## Constraints

서비스 기능, DB, 인증, 상세 아키텍처·도메인·코딩 규칙, CI/배포와 별도 task 자동화는 구성하지 않는다. task 상태별 디렉터리를 만들지 않는다. 앱별 지침에 공통 규칙을 반복하지 않는다.

## Acceptance Criteria

- [x] 필수 작업 지침 4개, task 템플릿과 번호 규칙이 일치한다.
- [x] pnpm 설치 및 format:check, lint, typecheck, test, build가 통과한다.
- [x] web/admin에서 공통 UI와 preset 스타일을 확인한다.
- [x] API 기본 응답 테스트와 개발·빌드 산출물 실행을 확인한다.
- [x] 각 앱의 @/ 및 ~/ alias를 확인하고 임시 검증 코드를 제거한다.
- [x] diff를 검토하고 검증 결과 및 미정 항목을 기록한다.

## Verification

2026-09-08, Node 24.13.0 / pnpm 10.28.2에서 확인했다.

- `pnpm install --frozen-lockfile`: lockfile 변경 없이 통과.
- `pnpm format:check`, lint 및 typecheck: 통과. lint/typecheck는 `pnpm exec turbo run lint typecheck`로 함께 실행했다.
- `pnpm test`: API를 빌드하고 실제 HTTP `GET /`의 200 상태와 응답 본문을 검사하는 테스트 1개 통과.
- `pnpm build`: web/admin/API 모두 통과. 임시 검증 endpoint가 없는 최종 산출물을 생성했다.
- `pnpm dev` 및 각 앱의 `start`: 3000/3001/3002에서 정상 응답 확인.
- 임시 endpoint에서 각 앱의 `@/package.json`과 `~/package.json`이 서로 다른 올바른 루트로 해석되는 것을 개발 및 프로덕션 실행에서 확인한 뒤 코드를 제거했다.
- Playwright에서 두 웹 화면의 제목, 공통 Button, preset 색상, radius `0.875rem`, pointer 커서를 확인했다. 화면 캡처는 git에서 제외한 `output/playwright/`에 저장했다.
- Prettier import 그룹 순서 및 부수효과 import 경계 보존을 임시 입력으로 확인했다.
- 신규 파일 내용을 검토했고 기존 workspace 이름이나 임시 검증 코드가 남지 않았음을 확인했다.

미수행: 웹/UI 자동 테스트는 아직 도입하지 않았다. 이 작업의 화면 검증은 브라우저 확인으로 수행했다.

미정: DB, 인증·권한, API 계약, 상태 관리, 데이터 fetching, 배포·CI, 상세 아키텍처와 도메인 모델은 후속 task에서 정한다.
