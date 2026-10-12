# API Container Startup

## Goal

Cloudtype의 API 컨테이너가 시작할 때 전체 workspace 의존성을 다시 설치하지 않도록 한다.

## Context

- 0019 배포 준비에서 API 이미지의 시작 명령에 `pnpm --filter @comit/api db:deploy`를 사용했다.
- 실행 로그에 `Scope: all 6 workspace projects`와 Next.js·Storybook 패키지 다운로드가 반복된다.
- 실행 이미지는 루트, API, 공유 패키지 4개로 구성돼 6개 workspace가 발견된다.
- pnpm의 `verifyDepsBeforeRun` 기본값은 `install`이며 스크립트 실행 전에 의존성 상태가 다르면 자동 설치를 수행한다.
- 공유 UI 패키지의 의존성을 설치하느라 API 수신이 시작되지 않고 Cloudtype의 시작 상태 검사 실패·재시작이 반복됐다.

## Scope

루트 Dockerfile의 빌드·시작 명령, 배포 문서.

## Requirements

- 의존성 설치는 이미지 빌드 중 명시한 frozen-lockfile 명령에서만 실행한다.
- API 빌드는 설치된 Prisma·Nest CLI를 직접 실행한다.
- 컨테이너 시작은 설치된 Prisma CLI로 마이그레이션을 적용한 뒤 Node로 API를 실행한다.
- 마이그레이션 실패 시 API를 시작하지 않는다.
- 개발·Vercel 환경의 pnpm 정책과 버전은 변경하지 않는다.

## Constraints

운영 DB를 테스트용으로 사용하지 않는다. 실제 Cloudtype 재배포 결과와 로컬 검증을 구분한다.

## Acceptance Criteria

- [x] 빌드와 시작 명령이 pnpm의 스크립트 자동 설치를 거치지 않는다.
- [x] 시작 명령과 API 구동을 검증하고 한계를 기록했다.
- [x] 배포 문서에 변경 원인과 재배포 방법을 반영했다.

## Verification

- 런타임과 같은 6개 workspace의 manifest를 격리 폴더에 복사하고 offline 모드에서 기존 pnpm 시작 명령을 실행했다. 마이그레이션 전에 `Scope: all 6 workspace projects` 설치가 시작되고 캐시에 없는 패키지 때문에 실패함을 재현했다. 실제 환경 변수 파일은 복사하지 않았다.
- Dockerfile의 새 빌드 명령과 같은 Prisma Client 생성·Nest CLI 직접 빌드를 로컬에서 실행해 통과했다.
- 연결 불가능한 로컬 테스트 DB 주소로 새 시작 명령을 실행해 Prisma schema engine 오류로 종료되고 API가 시작되지 않음을 확인했다. 이 실행에서 pnpm 설치 로그는 없었다.
- Node로 API를 직접 실행하고 `HOST=0.0.0.0`에서 `/` HTTP 응답을 확인했다. 운영 DB는 사용하지 않았다.
- 변경된 문서의 Prettier 검사와 diff 검사 통과.
- 로컬 Docker 엔진은 10초 내 응답하지 않아 최종 이미지 빌드·실행을 이번 작업에서 검증하지 못했다. 실제 DB 마이그레이션 성공과 Cloudtype 재배포는 아직 미검증이다.

## References

- [pnpm verifyDepsBeforeRun](https://pnpm.io/settings/build#verifydepsbeforerun)
- [pnpm 12.8 변경 기록](https://pnpm.io/blog/releases/12.8): 자동 설치의 필터 범위 처리 수정 기록.
