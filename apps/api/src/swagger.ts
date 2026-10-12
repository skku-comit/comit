import { applyDecorators, INestApplication } from "@nestjs/common"
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  DocumentBuilder,
  SwaggerModule,
} from "@nestjs/swagger"
import type { SchemaObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface"
import { z } from "zod"

function schema(
  value: z.ZodType,
  io: "input" | "output" = "input"
): SchemaObject {
  return z.toJSONSchema(value, {
    target: "openapi-3.0",
    io,
  }) as SchemaObject
}

const errorSchema = schema(
  z.object({ statusCode: z.number().int(), message: z.string() })
)

export function ApiEndpoint(options: {
  summary: string
  description?: string
  auth?: boolean
  admin?: boolean
  body?: z.ZodType
  response: z.ZodType
  status?: number
  params?: string[]
  query?: z.ZodObject
}) {
  const decorators = [
    ApiOperation({
      summary: options.summary,
      description: [
        options.admin ? "관리자 권한이 필요합니다." : undefined,
        options.description,
      ]
        .filter(Boolean)
        .join("\n\n"),
    }),
    ApiResponse({
      status: options.status ?? 200,
      description: "성공",
      schema: schema(options.response, "output"),
    }),
  ]
  if (options.auth || options.admin) {
    decorators.push(
      ApiBearerAuth(),
      ApiResponse({
        status: 401,
        description: "로그인 필요",
        schema: errorSchema,
      }),
      ApiResponse({
        status: 403,
        description: "권한 없음",
        schema: errorSchema,
      })
    )
  }
  for (const status of [400, 404, 409, 500]) {
    decorators.push(
      ApiResponse({
        status,
        description: {
          400: "입력 또는 요청 조건 오류",
          404: "대상을 찾을 수 없음",
          409: "중복 요청 또는 현재 상태와 충돌",
          500: "서버 오류",
        }[status],
        schema: errorSchema,
      })
    )
  }
  if (options.body) {
    decorators.push(ApiBody({ schema: schema(options.body) }))
  }
  for (const name of options.params ?? []) {
    decorators.push(ApiParam({ name, format: "uuid", type: String }))
  }
  if (options.query) {
    const query = schema(options.query)
    for (const [name, property] of Object.entries(query.properties ?? {})) {
      decorators.push(
        ApiQuery({ name, required: false, schema: property as SchemaObject })
      )
    }
  }
  return applyDecorators(...decorators)
}

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("comit API")
    .setDescription(
      "부원·학기·가입 신청·스터디 API. 인증이 필요한 요청은 Authorize에 Supabase access token을 입력하세요."
    )
    .setVersion("1.0.0")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" })
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("docs", app, document, { jsonDocumentUrl: "docs-json" })
}
