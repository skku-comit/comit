# 코밋 디자인 시스템

## Goal

web과 admin이 공유하는 차분하고 친근한 초록색 디자인 시스템을 구축한다.

## Context

기획 문서 0004를 바탕으로 기존 shadcn·Base UI·Pretendard를 확장한다.

## Scope

### packages

`packages/ui`의 토큰, 공통 컴포넌트, 내부 Storybook, 문서 및 정적 조합 예제.

### apps/web · apps/admin

기존 공개 imports와 시작 화면의 호환성을 검증한다.

## Requirements

라이트·다크 토큰, 기본 폼·피드백·목록 요소, 키보드 접근성, 로딩 및 오류 상태를 제공한다.
Storybook은 6006 포트에서 실행하고 패키지 내부에 정적으로 빌드한다.

## Constraints

실제 홈페이지·인증·회원·관리자 기능, API, Figma, 로고 제작, 외부 배포는 제외한다.
Button API와 CSS 토큰 이름을 유지한다. 표 정렬·필터·페이지네이션은 구현하지 않는다.

## Acceptance Criteria

- [x] 양쪽 테마와 모바일·데스크톱에서 상태 및 긴 한글 문구를 확인한다.
- [x] 키보드 조작과 다이얼로그 포커스 복귀를 확인한다.
- [x] 본문과 의미 색상의 대비를 점검한다.
- [x] lint·typecheck·format·web/admin/Storybook 빌드를 통과한다.
- [x] 스토리와 설정은 공개 exports에서 제외하고 검사에는 포함한다.

## Verification

- web·admin·UI lint와 typecheck, 두 Next.js 앱 빌드, Storybook 정적 빌드 및 전체 format 검사를 통과했다.
- Playwright와 axe로 32개 스토리의 라이트·다크 총 64개 상태를 검사했다. 발견된 대비·제목 계층·표 스크롤 접근성 문제를 수정하고 해당 상태의 재검사를 통과했다.
- 다이얼로그의 Enter 열기·초기 포커스·Tab 이동·Escape 닫기·트리거 포커스 복귀, 탭의 방향키·Enter 전환을 확인했다.
- Storybook의 Vite 클라이언트 번들에서 Base UI의 `use client` 지시문 관련 경고가 발생하지만 빌드는 성공한다. 앱은 UI 소스를 직접 사용하며 Next.js 빌드도 통과한다.
