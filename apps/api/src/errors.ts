import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common"
import { Prisma } from "@prisma/client"

@Catch()
export class ApiErrors implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    let status = 500
    let message = "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."
    if (error instanceof HttpException) {
      status = error.getStatus()
      message = error.message
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (["P2002", "P2034"].includes(error.code)) {
        status = 409
        message =
          "중복되거나 다른 요청이 먼저 처리되었습니다. 새로고침 후 확인해 주세요."
      } else if (error.code === "P2025") {
        status = 404
        message = "대상을 찾을 수 없습니다."
      }
    }
    host
      .switchToHttp()
      .getResponse()
      .status(status)
      .json({ statusCode: status, message })
  }
}
