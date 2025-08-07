import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

import JwtService from './../module/login/jwt.service'
import UserService from './../module/user/user.service';

export { USER_ROLE } from './../constants'

const jwtService = new JwtService();
const userService = new UserService();

@Injectable()
export class RequireRolesInterceptor implements NestInterceptor {
  constructor(
    private readonly requiredRoles: any[],
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    const { userId, userEmail } = await jwtService.verifyUserIsLogin({
      request,
    });
    let userInfo: any
    if (userId) {
      userInfo = await userService.queryById({ id: userId });
    } else if (userEmail) {
      userInfo = await userService.queryByEmail({ email: userEmail });
    }

    if (!this.requiredRoles.some(role => role === userInfo?.role as any)) {
      throw new ForbiddenException('您无权限进行此操作');
    }
    return next.handle();
  }
}