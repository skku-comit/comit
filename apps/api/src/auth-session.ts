import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

import {
  Controller,
  ForbiddenException,
  Get,
  Header,
  Post,
  Query,
  Req,
  Res,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common"
import { ApiTags } from "@nestjs/swagger"
import { createClient, type Session, type User } from "@supabase/supabase-js"
import { z } from "zod"

import {
  allowedOrigin,
  allowedOrigins,
  apiOrigin,
  BrowserRequest,
  BrowserResponse,
  cookieOptions,
  loginCookie,
  readCookie,
  sessionCookie,
  setSessionCookie,
} from "./browser"
import { ApiEndpoint } from "./swagger"
import { parse } from "./validation"

const lifetime = 30 * 24 * 60 * 60
const loginSchema = z.object({
  origin: z.string().url(),
  destination: z.enum(["/", "/my"]).default("/my"),
})
const sessionSchema = z.object({
  kind: z.literal("session"),
  origin: z.string(),
  expires: z.number(),
  access: z.string(),
  refresh: z.string(),
  tokenExpires: z.number(),
})
const stateSchema = z.object({
  kind: z.literal("login"),
  origin: z.string(),
  expires: z.number(),
  storage: z.record(z.string(), z.string()),
  flowId: z.string().nullable(),
  destination: z.enum(["/", "/my"]),
})

function key() {
  const secret = process.env.AUTH_SESSION_SECRET ?? ""
  if (!/^[0-9a-f]{64}$/i.test(secret))
    throw new ServiceUnavailableException(
      "AUTH_SESSION_SECRET 설정이 필요합니다."
    )
  return Buffer.from(secret, "hex")
}
function seal(value: unknown) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key(), iv)
  const data = Buffer.concat([
    cipher.update(JSON.stringify(value)),
    cipher.final(),
  ])
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url")
}
function open(value: string) {
  const secret = key()
  try {
    const data = Buffer.from(value, "base64url")
    const decipher = createDecipheriv(
      "aes-256-gcm",
      secret,
      data.subarray(0, 12)
    )
    decipher.setAuthTag(data.subarray(12, 28))
    return JSON.parse(
      Buffer.concat([
        decipher.update(data.subarray(28)),
        decipher.final(),
      ]).toString()
    ) as unknown
  } catch {
    throw new UnauthorizedException("유효하지 않은 세션입니다.")
  }
}
export function authClient(storage?: Record<string, string>) {
  const url = process.env.SUPABASE_URL
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
  if (!url || !publishableKey)
    throw new ServiceUnavailableException("인증 설정이 필요합니다.")
  return createClient(url, publishableKey, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: Boolean(storage),
      storageKey: "comit-auth",
      ...(storage
        ? {
            storage: {
              getItem: (name: string) => storage[name] ?? null,
              setItem: (name: string, value: string) => {
                storage[name] = value
              },
              removeItem: (name: string) => {
                delete storage[name]
              },
            },
          }
        : {}),
    },
  })
}
export function identity(user: User | null) {
  const email = user?.email?.toLowerCase()
  if (
    !user ||
    !email ||
    !user.email_confirmed_at ||
    !user.identities?.some((item) => item.provider === "google")
  )
    throw new UnauthorizedException("학교 Google 계정으로 로그인해 주세요.")
  if (!["g.skku.edu", "skku.edu"].includes(email.split("@")[1] ?? ""))
    throw new ForbiddenException("학교 계정만 사용할 수 있습니다.")
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
  return { id: user.id, email, isAdmin: admins.includes(email) }
}
function sessionValue(
  session: Session,
  origin: string,
  expires = Date.now() + lifetime * 1000
) {
  return seal({
    kind: "session",
    origin,
    expires,
    access: session.access_token,
    refresh: session.refresh_token,
    tokenExpires: session.expires_at ?? 0,
  })
}
export async function resolveSession(value: string, origin: string) {
  const parsed = sessionSchema.safeParse(open(value))
  if (
    !parsed.success ||
    parsed.data.expires <= Date.now() ||
    parsed.data.origin !== origin
  )
    throw new UnauthorizedException("로그인이 필요합니다.")
  const session = parsed.data
  let access = session.access
  let renewed: string | undefined
  if (session.tokenExpires <= Date.now() / 1000 + 60) {
    const { data, error } = await authClient().auth.refreshSession({
      refresh_token: session.refresh,
    })
    if (error || !data.session)
      throw new UnauthorizedException("다시 로그인해 주세요.")
    access = data.session.access_token
    renewed = sessionValue(data.session, session.origin, session.expires)
  }
  return { access, renewed }
}

@ApiTags("인증")
@Controller("auth")
export class AuthController {
  @ApiEndpoint({
    summary: "Google 로그인 시작",
    query: loginSchema,
    status: 302,
    response: z.null(),
    description:
      "API 쿠키에 PKCE 상태를 저장하고 Google 로그인으로 이동합니다.",
  })
  @Header("Cache-Control", "no-store")
  @Get("login")
  async login(@Query() input: unknown, @Res() response: BrowserResponse) {
    const { origin, destination } = parse(loginSchema, input)
    allowedOrigin(origin)
    const id = randomBytes(16).toString("hex")
    const storage: Record<string, string> = {}
    const { data, error } = await authClient(storage).auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${apiOrigin()}/auth/callback?login=${id}`,
        skipBrowserRedirect: true,
      },
    })
    if (error || !data.url)
      throw new ServiceUnavailableException("로그인을 시작하지 못했습니다.")
    response.cookie(
      loginCookie(id),
      seal({
        kind: "login",
        origin,
        destination,
        expires: Date.now() + 600_000,
        storage,
        flowId: data.flowId,
      }),
      { ...cookieOptions(), maxAge: 600_000 }
    )
    response.redirect(302, data.url)
  }
  @ApiEndpoint({
    summary: "Google 로그인 콜백",
    status: 302,
    query: z.object({
      code: z.string().optional(),
      login: z.string(),
      error: z.string().optional(),
    }),
    response: z.null(),
  })
  @Header("Cache-Control", "no-store")
  @Get("callback")
  async callback(
    @Query() query: { code?: string; login?: string },
    @Req() request: BrowserRequest,
    @Res() response: BrowserResponse
  ) {
    if (!query.login || !/^[0-9a-f]{32}$/.test(query.login))
      throw new UnauthorizedException("로그인을 다시 시작해 주세요.")
    const cookie = loginCookie(query.login)
    const value = readCookie(request, cookie)
    response.clearCookie(cookie, cookieOptions())
    if (!value) throw new UnauthorizedException("로그인을 다시 시작해 주세요.")
    const parsed = stateSchema.safeParse(open(value))
    if (!parsed.success)
      throw new UnauthorizedException("로그인을 다시 시작해 주세요.")
    const state = parsed.data
    allowedOrigin(state.origin)
    try {
      if (
        !query.code ||
        query.code.length > 2048 ||
        state.expires <= Date.now()
      )
        throw new UnauthorizedException("인증 코드가 없습니다.")
      const client = authClient(state.storage)
      const { data, error } = await client.auth.exchangeCodeForSession(
        query.code,
        state.flowId ? { flowId: state.flowId } : undefined
      )
      if (error || !data.session)
        throw new UnauthorizedException("로그인을 완료하지 못했습니다.")
      const verified = await client.auth.getUser(data.session.access_token)
      try {
        if (verified.error) throw verified.error
        identity(verified.data.user)
      } catch {
        await client.auth.admin.signOut(data.session.access_token, "local")
        throw new UnauthorizedException("학교 Google 계정으로 로그인해 주세요.")
      }
      setSessionCookie(
        response,
        state.origin,
        sessionValue(data.session, state.origin)
      )
      response.redirect(302, `${state.origin}${state.destination}`)
    } catch {
      response.redirect(302, `${state.origin}/login?error=1`)
    }
  }
  @ApiEndpoint({
    summary: "현재 세션 로그아웃",
    status: 303,
    response: z.null(),
    description:
      "허용된 프론트 Origin의 세션 쿠키를 삭제하고 해당 앱의 로그인 화면으로 이동합니다.",
  })
  @Header("Cache-Control", "no-store")
  @Post("logout")
  async logout(
    @Req() request: BrowserRequest,
    @Res() response: BrowserResponse
  ) {
    const origin = request.headers.origin ?? ""
    if (!allowedOrigins().includes(origin))
      throw new ForbiddenException("허용되지 않은 요청입니다.")
    const cookie = sessionCookie(origin)
    const session = readCookie(request, cookie)
    try {
      if (session) {
        const { access } = await resolveSession(session, origin)
        const { error } = await authClient().auth.admin.signOut(access, "local")
        if (error && ![401, 403, 404].includes(error.status ?? 0))
          throw new ServiceUnavailableException(
            "로그아웃을 완료하지 못했습니다."
          )
      }
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) throw error
    }
    response.clearCookie(cookie, cookieOptions())
    response.redirect(303, `${origin}/login`)
  }
}
