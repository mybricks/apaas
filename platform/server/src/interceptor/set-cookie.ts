import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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