
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Logger } from '@mybricks/rocker-commons';

@Catch()
export class ErrorExceptionFilter implements ExceptionFilter {
  constructor() {}
  catch(exception, host: ArgumentsHost) {

    const ctx = host.switchToHttp(); // 获取请求上下文
    const request = ctx.getRequest(); // 获取请求上下文中的request对象
    const response = ctx.getResponse(); // 获取请求上下文中的response对象
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR; // 获取异常状态码
   
    // 将异常记录到logger中
    Logger.error(
      `[全局错误拦截] ${JSON.stringify(exception?.stack)} ${request.method} ${request.url}`,
    );

    // 返回错误
    response.status(status).json({
      timestamp: Date.now(),
      message: exception.message,
      code: -1,
      path: request.url,
    });
  }
}
