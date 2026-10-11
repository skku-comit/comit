import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common"
import { createClient } from "@supabase/supabase-js"

export interface Identity {
  id: string
  email: string
  isAdmin: boolean
}
export const Actor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Identity =>
    ctx.switchToHttp().getRequest().identity
)
export function requireAdmin(actor: Identity) {
  if (!actor.isAdmin) throw new ForbiddenException("관리자 권한이 필요합니다.")
}
@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext) {
    const request = ctx.switchToHttp().getRequest()
    const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1]
    if (!token) throw new UnauthorizedException("로그인이 필요합니다.")
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_PUBLISHABLE_KEY
    if (!url || !key) throw new UnauthorizedException("인증 설정이 필요합니다.")
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data, error } = await client.auth.getUser(token)
    const user = data.user
    const email = user?.email?.toLowerCase()
    if (
      error ||
      !user ||
      !email ||
      !user.email_confirmed_at ||
      !user.identities?.some((i) => i.provider === "google")
    )
      throw new UnauthorizedException("학교 Google 계정으로 로그인해 주세요.")
    if (!["g.skku.edu", "skku.edu"].includes(email.split("@")[1] ?? ""))
      throw new ForbiddenException("학교 계정만 사용할 수 있습니다.")
    const admins = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean)
    request.identity = { id: user.id, email, isAdmin: admins.includes(email) }
    return true
  }
}
