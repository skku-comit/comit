# Repository Privacy

## Goal

저장소 공개 전에 실제 스터디장 이름을 소스·문서와 GitHub 브랜치 히스토리에서 제거한다.

## Context

공개 전 점검에서 기존 자율 스터디 등록 스크립트와 task 문서에 실명이 발견되었다.
현재 파일만 수정하면 과거 커밋에서 조회할 수 있으므로 기존 커밋 흐름을 유지하면서 해당 내용만 정리한다.

## Scope

- `apps/api/scripts/register-medical-ai-study.cjs`: 스터디 설명에서 이름 안내 제거.
- `docs/tasks/0014-legacy-autonomous-study.md`: 이름이 포함된 요구사항·검증 기록 정리.
- GitHub `main`과 로컬 `main`: 정리된 히스토리로 교체.

## Requirements

- 현재 파일과 브랜치의 모든 과거 커밋에 실명이 남지 않아야 한다.
- 기존 커밋 수·작성자·메시지와 무관한 파일을 보존한다.
- 원격 HEAD를 확인한 `--force-with-lease`로 다른 사람의 변경을 덮어쓰지 않는다.
- 미커밋 배포 준비 변경을 보존한다.

## Constraints

- 운영 DB에 저장된 스터디 정보는 변경하지 않는다.
- 저장소 공개 전환과 커밋 작성자 이메일 변경은 이번 범위에서 제외한다.
- 기존 커밋 SHA와 GitHub 캐시의 보존 여부를 결과에 명시한다.

## Acceptance Criteria

- [x] 소스·문서에서 실명이 제거되었다.
- [x] 정리된 히스토리와 기존 기록의 차이가 대상 두 파일에 한정됨을 검증했다.
- [x] 원격 `main` 교체와 로컬 동기화를 확인했다.
- [x] 미커밋 배포 변경 보존과 포맷·구문 검사를 확인했다.

## Verification

2026-10-12 확인 결과:

- 분리된 임시 checkout에서 git-filter-repo로 대상 두 파일만 정리했다.
- 기존 커밋 16개의 작성자·작성 일시·커미터·메시지를 보존했다. 영향받은 커밋 5개의 SHA가 변경되었다.
- 각 커밋의 파일 트리를 기존 기록과 비교해 대상 두 파일 외 변경이 없음을 확인했다.
- 정리된 히스토리와 로컬 `main`에서 이름 문자열이 포함된 blob 0개를 확인했다.
- 원격에 브랜치 `main`만 존재하고 태그·열린 PR이 없음을 확인했다.
- `--force-with-lease`로 원격 `main`을 반영했다. 새 HEAD는 `ccbfd74c9b05bbe781a4f5037e78b8180d675f0c`이며 로컬 `main`과 `origin/main`도 동기화했다.
- 기존 미커밋 배포 변경 파일 10개의 SHA-256이 작업 전후 동일함을 확인했다.
- 등록 스크립트의 Node 구문 검사, 대상 파일의 Prettier 검사, diff 검사 통과. 데이터 스크립트 실행과 운영 DB 수정은 수행하지 않았다.
- 저장소는 private을 유지한다.

## GitHub 잔여 기록

브랜치 기록에서는 이름이 제거되었으나 이전 커밋을 지정한 GitHub Contents API 조회에서 원본 blob이 여전히 반환되었다.
이전 커밋과 blob의 식별자는 공개 문서에 포함하지 않고 로컬 지원 요청 초안에만 기록했다.
완전한 제거를 위해 GitHub Support에 잔여 커밋·blob·캐시 정리를 요청하고 처리 후 다시 확인해야 한다.
지원 요청은 아직 전송하지 않았다. 로컬 `docs/github-privacy-support.md`의 지원 요청 초안을 사용한다. 이 파일은 Git 추적에서 제외한다.

다른 사람이 기존 저장소를 clone했다면 정리된 저장소를 새로 clone해 과거 히스토리가 다시 push되지 않도록 한다.
로컬 reflog·도구의 내부 checkpoint·별도 clone에 남은 옛 Git 객체는 GitHub의 일반 브랜치 push 대상이 아니며 이번 작업에서 일괄 삭제하지 않았다.
