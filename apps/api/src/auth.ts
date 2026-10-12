import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common"

import { authClient, identity, resolveSession } from "./auth-session"
import {
  allowedOrigins,
  cookieOptions,
  readCookie,
  sessionCookie,
  setSessionCookie,
} from "./browser"

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
    let token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1]
    const origin = request.headers.origin ?? ""
    const session = allowedOrigins().includes(origin)
      ? readCookie(request, sessionCookie(origin))
      : undefined
    if (session) {
      const response = ctx.switchToHttp().getResponse()
      try {
        const resolved = await resolveSession(session, origin)
        token = resolved.access
        if (resolved.renewed)
          setSessionCookie(response, origin, resolved.renewed)
        response.setHeader("Cache-Control", "no-store")
      } catch (error) {
        if (error instanceof UnauthorizedException)
          response.clearCookie(sessionCookie(origin), cookieOptions())
        throw error
      }
    }
    if (!token) throw new UnauthorizedException("로그인이 필요합니다.")
    const { data, error } = await authClient().auth.getUser(token)
    if (error)
      throw new UnauthorizedException("학교 Google 계정으로 로그인해 주세요.")
    request.identity = identity(data.user)
    return true
  }
}
