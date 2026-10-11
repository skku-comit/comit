# 사용자·학기별 부원 등록 관리

## Goal

학교 Google 로그인부터 신규 가입·재등록, 관리자 입금 확인·승인까지 실제 DB로 구현한다.

## Context

0004 웹사이트 기획과 사용자 합의에 따라 User, Membership, Semester를 분리한다.

## Scope

apps/api, apps/web, apps/admin, packages/contracts 및 실행 문서.

## Requirements

- Supabase PostgreSQL 직접 연결과 Prisma 마이그레이션.
- 학교 도메인 제한과 서버 관리자 권한 검증.
- 개인 정보, 학기별 모집·회비·공통 계좌·동의문 설정.
- 학번 매칭 후 관리자 계정 연결 확인, 과거 승인 이력 기반 재등록.
- 입금 확인 후 승인, 보완 재제출, 처리 이력 보존.

## Constraints

CSV, 삭제, 환불, 결제, 스터디는 제외한다. 비밀 값은 커밋하지 않는다.

## Acceptance Criteria

- [x] 신규 신청·재등록·보완·승인을 검증한다.
- [x] 중복 및 권한·상태 충돌을 차단한다.
- [x] 관리자 화면과 사용자 화면을 실제 API에 연결한다.
- [x] lint, typecheck, test, build 결과와 외부 연동 제한을 기록한다.

## Verification

2026-10-10, Node 26.8.1 / pnpm 12.3.4.

- 전체 lint, typecheck, format:check, build 및 git diff --check 통과.
- 임시 PostgreSQL 18.3에서 초기 마이그레이션과 전용 comit_api 역할 연결을 검증했다.
- 실제 DB를 사용한 테스트를 포함해 API 테스트 12개 통과: 신규 신청, 중복 방지, 미입금 승인 차단, 보완 재제출, 재등록, 수동 명부·학번 연결, 동시 처리, 필터·기간·동의, HTTP 권한 검증.
- Playwright로 비로그인·환경 설정 오류 화면, 테스트 응답 기반 사용자 신청 제출, 관리자 목록·상세·입금 확인·승인·학기 설정을 확인했다. 모바일 상세 화면 캡처는 output/playwright/에 보관한다.
- 실제 Supabase에 전용 `comit_api` 역할과 `comit` 스키마를 생성하고 Prisma 초기 마이그레이션을 적용했다. 로컬 IPv6 연결 경로가 없어 사용자 동의에 따라 무료 Session pooler(5432)를 사용한다.
- Google OAuth 클라이언트, Supabase Google provider, 두 로컬 콜백 주소 및 학교 계정 테스트 사용자를 설정했다. 실제 학교 Google 계정으로 관리자 로그인·콜백·서버 관리자 권한 판정과 신청 목록·부원 명부·학기 목록 조회를 확인했다. Supabase DB의 테이블 생성 및 전용 역할을 통한 조회도 확인했다. 실제 운영 신청·승인은 아직 실행하지 않았다. 비밀 값은 gitignore된 환경 파일에만 저장한다.
- 운영진 확정 동의문·회비·계좌·모집 기간은 환경 설정 후 관리자 화면에서 입력해야 한다. 기존 운영 데이터는 이전하지 않았다.

2026-10-11 로그인 후 빈 응답 처리 수정: 현재 학기가 없을 때 빈 본문을 JSON null로 정규화하고, 웹·관리자 요청 도우미에서 빈 응답 및 JSON이 아닌 오류 응답을 처리한다.
