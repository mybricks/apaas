import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { getRealHostName } from './../utils';

@Injectable()
export class SetCookieWhenCode1AndResHasCookieInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        if (data.code === 1 && data?.data?.cookie) {
          response.cookie('mybricks-login-user', data.data.cookie);
          data.data.cookie = encodeURIComponent(data.data.cookie)
        }
        return data;
      }),
    );
  }
}

@Injectable()
export class SetForAICookieWhenCode1Interceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        if (data.code === 1) {
          const loginMybricksCookie = request.cookies['mybricks-login-user'];
          let mybricksCookie = request.cookies['mybricks-user'];
          try {
            mybricksCookie = decodeURIComponent(mybricksCookie)
          } catch (error) {}
          const cookieShouldSet = mybricksCookie !== loginMybricksCookie;
          if (getRealHostName(request.headers) === 'my.mybricks.world' && cookieShouldSet) {
            response.cookie('mybricks-user', loginMybricksCookie, {
              domain: '.mybricks.world',
            });
          }
        } else {
          const mybricksCookie = request.cookies['mybricks-user'];
          if (mybricksCookie) {
            response.clearCookie('mybricks-user', {
              domain: '.mybricks.world'
            });
          }
        }
        return data;
      }),
    );
  }
}