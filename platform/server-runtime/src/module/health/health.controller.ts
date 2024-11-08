import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
  Query,
  Param,
  Request,
  Req,
  UseInterceptors,
  UploadedFile,
  UseFilters,
  Head,
  HttpCode,
} from '@nestjs/common';

@Controller('/health')
export default class HealthController {

  @Head()
  @HttpCode(200)
  headHealthCheck() {
    return {
      code: 1
    };
  }
}