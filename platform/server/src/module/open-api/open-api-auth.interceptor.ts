import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Logger } from '@mybricks/rocker-commons'
import { Observable, of } from 'rxjs';
import { OpenApiErrCode } from './types'
import { accessToken } from './../../utils/shared'


@Injectable()
export class OpenApiAuthInterceptor implements NestInterceptor {

  constructor(private readonly scecretKey: string) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const query = request.query;

    if (!this.scecretKey) {
      return of({
        code: OpenApiErrCode.CONFIG_NOT_FOUND,
        message: '当前服务器未启用openApi配置，请联系管理员',
      })
    }

    if (!query?.access_token) {
      return of({
        code: OpenApiErrCode.INVALID_TOKEN,
        message: '缺少access_token',
      })
    }

    try {
      const { payload } = accessToken.verifyAccessToken(query?.access_token, this.scecretKey)
      if (payload?.appId) {
        Logger.info(`[application: openapi] [appId: ${payload.appId}] [method: ${request.method}] [path: ${request.path}] [ip: ${request.ip}]`)
      }
    } catch (error) {
      return of({
        code: OpenApiErrCode.INVALID_TOKEN,
        message: error?.message ?? 'token校验失败',
      })
    }

    return next.handle();
  }
}