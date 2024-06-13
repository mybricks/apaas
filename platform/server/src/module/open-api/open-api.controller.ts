import { Body, Controller, Get, Res, Post, Query, UseInterceptors } from "@nestjs/common";
import { Logger } from '@mybricks/rocker-commons'
import JwtService from "./../login/jwt.service";
import UserDao from "../../dao/UserDao";
import { OpenApiErrCode } from './types'
import { SetCookieWhenCode1AndResHasCookieInterceptor } from './../../interceptor/set-cookie'
import { OpenApiAuthInterceptor } from './open-api-auth.interceptor'
const userConfig = require('./../../../../../scripts/shared/read-user-config.js')();

@Controller("/paas/api/open")
@UseInterceptors(new OpenApiAuthInterceptor(userConfig?.openApi?.tokenSecretOrPrivateKey))
export default class OpenApiController {

  jwtService = new JwtService();
  userDao = new UserDao();


  @Post("/signin")
  @UseInterceptors(SetCookieWhenCode1AndResHasCookieInterceptor)
  async signIn(@Body('userId') userId: number) {
    if (!userId) {
      return {
        code: OpenApiErrCode.INVALID_PARAM,
        message: '缺少 userId 参数'
      }
    }

    try {
      const userInfo = await this.userDao.queryById({ id: userId })
      if (!userInfo) {
        return {
          code: OpenApiErrCode.USER_NOT_EXIST,
          message: '用户不存在，请先注册/创建用户'
        }
      }

      const token = await this.jwtService.updateFingerprint(userId)
      Logger.info(`[open-api: signin] 用户 ${userId} 登录完成.`);
      return {
        code: OpenApiErrCode.SUCCESS,
        data: {
          cookie: JSON.stringify({
            id: userId,
            email: '',
            fingerprint: token,
          }),
          token,
        },
      };
    } catch (ex) {
      Logger.error(`[open-api: signin] 未知错误 ${ex?.stack?.toString?.()} `);
      return {
        code: OpenApiErrCode.ERROR,
        message: ex.message,
      };
    }
  }
}
