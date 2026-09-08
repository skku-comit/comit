# Runtime Upgrade

## Goal

Node.js와 pnpm을 최신 정식 버전으로 갱신한다.

## Context

초기 환경은 Node 24.13.0과 pnpm 10.28.2로 검증했다. 사용자 요청에 따라 2026-09-08 공식 배포 인덱스 기준 Node 26.8.1(Current), pnpm 12.3.4로 변경한다.

## Scope

루트 버전·pnpm 설치 설정, lockfile과 README.

## Requirements

- Node 26.8.1과 pnpm 12.3.4를 고정한다.
- pnpm 12 설정 형식에 맞게 설치 설정을 변경한다.
- 기존 서비스 의존성 버전은 가능한 한 유지한다.

## Constraints

서비스 코드와 상세 기술 스택은 변경하지 않는다. 최초 task의 과거 검증 기록을 보존한다.

## Acceptance Criteria

- [x] 버전 설정과 README가 일치한다.
- [x] 최신 환경에서 frozen-lockfile 설치가 통과한다.
- [x] format:check, lint, typecheck, test, build가 통과한다.

## Verification

Node 26.8.1 / pnpm 12.3.4에서 확인했다.

- frozen-lockfile 설치 통과.
- lint/typecheck 8개 작업, API HTTP 테스트 1개, 앱 빌드 3개를 Turbo 캐시 없이 실행해 모두 통과.
- format:check 통과.
- `.npmrc`의 engine-strict/save-exact를 `pnpm-workspace.yaml`의 engineStrict/saveExact로 이전하고 실제 설정값이 true임을 확인했다.
- 기존 onlyBuiltDependencies를 pnpm 12의 allowBuilds로 이전했다.
- 기존에 설치·검증된 `lucide-react@1.42.0`만 게시 후 대기 시간 예외로 지정해 기존 의존성을 유지했다. 전체 대기 시간 정책은 유지한다.
- 최초 task의 과거 검증 기록은 변경하지 않았다. 이번 작업에서는 브라우저 화면 검증을 반복하지 않았다.
