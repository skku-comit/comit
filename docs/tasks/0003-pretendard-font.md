# Pretendard Font

## Goal

web·admin과 공통 UI의 모든 글꼴을 로컬 Pretendard로 통일한다.

## Context

두 앱은 Geist와 Geist Mono를 Google Fonts에서 가져오고 공통 UI 스타일을 사용한다.

## Scope

apps/web·apps/admin의 루트 레이아웃, packages/ui의 공통 스타일·폰트 자산, README.

## Requirements

- 공식 Pretendard v1.3.9 Variable WOFF2와 원본 라이선스를 공통 UI 패키지에 포함한다.
- 공통 CSS에서 로컬 폰트를 제공하고 굵기 45–920, font-display: swap을 설정한다.
- 본문과 sans·heading·mono·serif 글꼴을 Pretendard로 통일한다.
- Google Fonts 로딩을 제거하고 폰트 출처·버전·제공 방식을 문서화한다.

## Constraints

기존 크기·굵기·자간·색상은 유지한다. 미지원 문자와 이모지는 시스템 글꼴로 대체한다. API 앱과 패키지 의존성은 변경하지 않는다.

## Acceptance Criteria

- [x] 두 앱과 공통 UI에 Pretendard가 적용된다.
- [x] 로컬 폰트가 정상 제공되고 외부 폰트 요청이 없다.
- [x] 기존 Geist 설정이 제거된다.
- [x] format:check, 관련 lint·typecheck·build와 브라우저 검증을 통과한다.

## Verification

Node 26.8.1 / pnpm 12.3.4에서 확인했다.

- `pnpm format:check` 통과.
- web·admin·ui의 lint·typecheck 6개 작업 통과.
- web·admin 프로덕션 빌드 통과. 최초 샌드박스 실행은 Turbopack의 내부 포트 바인딩 제한으로 실패했으며, 제한 밖에서 재실행해 통과했다.
- Chromium에서 두 앱의 제목·한글 본문·공통 버튼이 실제 Pretendard Variable로 렌더링됨을 CDP로 확인했다. 굵기는 각각 600·400·500으로 유지된다.
- 두 앱 모두 자체 `/_next/static/media/`의 WOFF2를 로드하고 외부 폰트 요청은 없었다.
- 화면 캡처를 `output/playwright/pretendard-3000.png`, `output/playwright/pretendard-3001.png`에 저장하고 확인했다.
- 앱·패키지에서 Geist와 `next/font/google` 참조가 없고 `git diff --check`가 통과했다.

폰트 출처: https://github.com/orioncactus/pretendard/tree/v1.3.9/packages/pretendard/dist/web/variable/woff2

미수행: Safari·Firefox 검증과 API 테스트는 이번 UI 폰트 변경에서 수행하지 않았다.
