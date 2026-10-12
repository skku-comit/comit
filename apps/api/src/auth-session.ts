import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Header,
  Headers,
  HttpCode,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common"
import { ApiTags } from "@nestjs/swagger"
import { createClient, type Session, type User } from "@supabase/supabase-js"
import { z } from "zod"

import { ApiEndpoint } from "./swagger"
import { parse } from "./validation"

const lifetime = 30 * 24 * 60 * 60
const loginSchema = z.object({ origin: z.string().url() })
const callbackSchema = loginSchema.extend({
  code: z.string().min(1).max(2048),
  state: z.string().min(1).max(8192),
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
function allowedOrigin(origin: string) {
  const allowed = (process.env.AUTH_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
  if (!allowed.includes(origin) || new URL(origin).origin !== origin)
    throw new BadRequestException("허용되지 않은 로그인 주소입니다.")
  return origin
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
    body: loginSchema,
    response: z.object({ url: z.string(), state: z.string() }),
  })
  @Header("Cache-Control", "no-store")
  @HttpCode(200)
  @Post("login")
  async login(@Body() input: unknown) {
    const { origin } = parse(loginSchema, input)
    allowedOrigin(origin)
    const storage: Record<string, string> = {}
    const { data, error } = await authClient(storage).auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    })
    if (error || !data.url)
      throw new ServiceUnavailableException("로그인을 시작하지 못했습니다.")
    return {
      url: data.url,
      state: seal({
        kind: "login",
        origin,
        expires: Date.now() + 600_000,
        storage,
        flowId: data.flowId,
      }),
    }
  }
  @ApiEndpoint({
    summary: "Google 인증 코드 교환",
    body: callbackSchema,
    response: z.object({ session: z.string() }),
  })
  @Header("Cache-Control", "no-store")
  @HttpCode(200)
  @Post("callback")
  async callback(@Body() input: unknown) {
    const { code, state, origin } = parse(callbackSchema, input)
    allowedOrigin(origin)
    const parsed = stateSchema.safeParse(open(state))
    if (
      !parsed.success ||
      parsed.data.expires <= Date.now() ||
      parsed.data.origin !== origin
    )
      throw new UnauthorizedException("로그인을 다시 시작해 주세요.")
    const client = authClient(parsed.data.storage)
    const { data, error } = await client.auth.exchangeCodeForSession(
      code,
      parsed.data.flowId ? { flowId: parsed.data.flowId } : undefined
    )
    if (error || !data.session)
      throw new UnauthorizedException("로그인을 완료하지 못했습니다.")
    // 토큰 응답에 포함된 사용자 정보도 Auth 서버에 다시 확인한다.
    const verified = await client.auth.getUser(data.session.access_token)
    try {
      if (verified.error) throw verified.error
      identity(verified.data.user)
    } catch {
      await client.auth.admin.signOut(data.session.access_token, "local")
      throw new UnauthorizedException("학교 Google 계정으로 로그인해 주세요.")
    }
    return { session: sessionValue(data.session, origin) }
  }
  @ApiEndpoint({
    summary: "현재 세션 로그아웃",
    body: z.object({}),
    response: z.object({ success: z.boolean() }),
  })
  @Header("Cache-Control", "no-store")
  @HttpCode(200)
  @Post("logout")
  async logout(
    @Headers("x-comit-session") session?: string,
    @Headers("x-comit-origin") origin?: string
  ) {
    if (session) {
      const { access } = await resolveSession(session, origin ?? "")
      const { error } = await authClient().auth.admin.signOut(access, "local")
      if (
        error &&
        error.status !== 401 &&
        error.status !== 403 &&
        error.status !== 404
      )
        throw new ServiceUnavailableException("로그아웃을 완료하지 못했습니다.")
    }
    return { success: true }
  }
}
