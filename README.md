# comit

pnpm과 Turborepo 기반 동아리 웹사이트 모노레포.

| 영역                                                   | 역할                    | 개발 주소             |
| ------------------------------------------------------ | ----------------------- | --------------------- |
| `apps/web`                                             | Next.js 일반 사용자 웹  | http://localhost:3000 |
| `apps/admin`                                           | Next.js 운영자 웹       | http://localhost:3001 |
| `apps/api`                                             | NestJS 백엔드 API       | http://localhost:3002 |
| `packages/ui`                                          | 공통 shadcn UI와 스타일 | —                     |
| `packages/typescript-config`, `packages/eslint-config` | 공통 개발 설정          | —                     |

## 시작하기

로컬 개발은 Node.js 26.8.1(Current)과 pnpm 12.3.4를 사용한다. Vercel 배포는 Node.js 24.x를 사용하며, `package.json`은 Node 24 이상 27 미만을 허용한다. `.node-version`, `package.json`과 `pnpm-lock.yaml`에 실행 환경과 의존성을 기록한다.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

개별 앱 실행은 `pnpm --filter @comit/web dev`처럼 사용한다. API 포트는 `PORT` 환경 변수로 변경할 수 있다.

브라우저는 `NEXT_PUBLIC_API_URL`의 API에 직접 요청한다. API가 쿠키 인증·CORS·Origin 검사를 처리한다. 환경 변수와 콜백·도메인은 [운영 배포 안내](docs/deployment.md)를 따른다.

API를 `pnpm --filter @comit/api dev`로 실행하면 [Swagger UI](http://localhost:3002/docs)에서 요청·응답과 권한을 확인하고 API를 실행할 수 있다. [OpenAPI JSON](http://localhost:3002/docs-json)도 제공한다. 인증이 필요한 요청은 Swagger의 **Authorize**에 Supabase 로그인으로 받은 access token을 입력한다(`Bearer` 접두사 제외). 관리자 API는 `ADMIN_EMAILS`에 등록된 계정이 필요하다. 문서 페이지는 인증 없이 접근할 수 있으며, API 호출에는 기존 권한 검증이 적용된다. 포트를 변경하면 문서 주소도 같은 포트를 사용한다.

```sh
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`test`는 현재 API의 실제 HTTP 응답을 검사한다. 웹/UI에는 아직 테스트가 없다. 빌드 후 `pnpm --filter @comit/api start` 또는 각 웹 앱의 `start`로 실행한다.

## 초기 설정

- web/admin은 Next.js App Router, api는 NestJS를 사용한다. 전체 TypeScript에 `strict: true`를 적용한다.
- UI는 shadcn CLI 4.21.0의 preset `b5cjpD6W2`와 `--template next --monorepo --pointer`로 생성했다. 두 웹 앱은 `@comit/ui/components/button`과 공통 CSS를 사용한다.
- 컴포넌트 추가는 `pnpm dlx shadcn@4.21.0 add button --cwd apps/web`처럼 실행한다. `components.json`이 공통 UI 패키지를 가리킨다.
- `~/`는 저장소 루트, `@/`는 해당 앱 또는 패키지 디렉터리 루트다. API의 예는 `@/src/app.module`이다. 앱 간 소스를 직접 참조하지 않고, 공통 코드는 `@comit/*` 공개 exports로 가져온다.
- Next.js는 tsconfig alias를 사용하고 API는 TypeScript 및 webpack에서 같은 alias를 해석한다.
- Prettier가 import를 Node 내장 → 외부 패키지 → `@comit/*` → `~/` → `@/` → 상대 경로 순으로 정렬한다. 그룹 사이에 빈 줄을 두며 부수효과 import 순서는 보존한다.
- 모든 UI 글꼴은 로컬 Pretendard Variable v1.3.9를 사용한다. 공통 CSS에서 `packages/ui/src/fonts/PretendardVariable.woff2`를 로드하며 외부 폰트 서비스 접근은 필요하지 않다. [공식 배포본](https://github.com/orioncactus/pretendard/tree/v1.3.9)과 [SIL Open Font License](packages/ui/src/fonts/LICENSE)를 함께 보관한다.

## 작업 문서

커밋 메시지는 [커밋 컨벤션](docs/commit-convention.md)을 따른다.

먼저 [AGENTS.md](AGENTS.md)를 읽고 [task 템플릿](docs/tasks/template.md)을 복사한다. 파일명은 `NNNN-task-name.md`로, 기존 최대 번호 다음 번호를 사용한다. 번호는 재정렬하거나 재사용하지 않는다. 새 task는 기존 최대 번호 다음 번호로 작성한다.

첫 작업: [0001-project-setup.md](docs/tasks/0001-project-setup.md).

부원 관리의 DB·학교 로그인·API·관리자 설정은 [부원 관리 실행 안내](docs/user-management-setup.md)를 참고한다. 스터디 DB·등록·승인·선발 절차는 [스터디 운영 실행 안내](docs/study-management-setup.md)를 참고한다. Vercel·Cloudtype 배포와 Cloudflare 도메인 연결은 [운영 배포 안내](docs/deployment.md)를 참고한다. CI와 나머지 도메인은 후속 task에서 정의한다.

## 디자인 시스템

공통 토큰과 컴포넌트, Storybook은 `packages/ui`에서 함께 관리한다.

```sh
pnpm --filter @comit/ui storybook
pnpm --filter @comit/ui build-storybook
```

Storybook은 http://localhost:6006 에서 실행한다. 루트에서는 `pnpm exec turbo storybook`과 `pnpm exec turbo build-storybook`으로도 실행할 수 있다. 정적 빌드는 `packages/ui/storybook-static`에 생성된다. 개발 의존성은 UI 패키지에만 두며 앱은 공개된 컴포넌트와 CSS만 가져온다. Storybook의 시작하기 문서에 디자인 원칙·토큰·사용 기준을, 조합 예제에 가상 가입 폼·스터디·관리자 목록을 정리한다.
