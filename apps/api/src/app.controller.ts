import { Controller, Get } from "@nestjs/common"
import { ApiTags } from "@nestjs/swagger"
import { z } from "zod"

import { ApiEndpoint } from "./swagger"

@ApiTags("기본")
@Controller()
export class AppController {
  @ApiEndpoint({
    summary: "API 상태 확인",
    response: z.object({ message: z.string() }),
  })
  @Get()
  getRoot() {
    return { message: "comit API" }
  }
}
