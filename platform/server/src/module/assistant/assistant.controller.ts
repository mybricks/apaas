import { Controller, Get, Post, Body, Headers, Res, Options, UseInterceptors } from '@nestjs/common';
import AssistantService, { AIServiceNotAvailableError } from './assistant.service';
import { Response } from 'express';
import { RequireRolesInterceptor, USER_ROLE } from './../../interceptor/require-role'

@Controller('api/assistant')
export default class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Get('/status')
  async getStatus() {
    try {
      const token = await this.assistantService.getAIToken();
      if (!token) {
        return {
          code: -1,
          message: '当前平台未提供AI服务'
        }
      }

      const pingCenter = await this.assistantService.checkAICenterHealth();
      if (!pingCenter) {
        return {
          code: -1,
          message: '访问AI服务失败'
        }
      }

      return {
        code: 1,
        message: 'AI服务已就绪'
      }
    } catch (error) {
      return {
        code: -1,
        message: error.message || 'AI服务异常'
      };
    }
  }

  @UseInterceptors(new RequireRolesInterceptor([USER_ROLE.NORMAL, USER_ROLE.ADMIN]))
  @Post('/stream')
  async stream(
    @Body() body: any,
    @Headers() headers: any,
    @Res() response: Response
  ) {
    try {
      const stream = await this.assistantService.streamToAICenter(body, headers);

      response.setHeader('X-Request-Id', stream.headers['X-Request-Id'] ?? stream.headers['x-request-id']);
      response.setHeader('X-Powered-App', stream.headers['X-Powered-App'] ?? stream.headers['X-Powered-App'] ?? 'platform');
      
      stream.data.pipe(response);
    } catch (error) {
      if (error instanceof AIServiceNotAvailableError) {
        response.status(401).json({
          code: -1,
          message: 'Unauthorized token'
        });
      } else {
        response.status(500).json({
          code: -1,
          data: null,
          message: error.message || 'AI服务异常'
        });
      }
    }
  }
} 