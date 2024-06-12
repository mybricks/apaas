import { Body, Controller, Get, Res, Post, Query, UseInterceptors } from "@nestjs/common";
import { Logger } from '@mybricks/rocker-commons'
import JwtService from "./../login/jwt.service";
import UserDao from "../../dao/UserDao";

import { SetCookieWhenCode1AndResHasCookieInterceptor } from './../../interceptor/set-cookie'

enum ErrCode {
  /** 成功 */
  SUCCESS = 1,

  /** 未知错误 */
  ERROR = -1,

  /** token错误或失效 */
  INVALID_TOKEN = 40002,

  /** 非法参数 */
  INVALID_PARAM = 40003,

  /** 用户不存在 */
  USER_NOT_EXIST = 46004,
}



@Controller("/paas/api/open")
export default class OpenApiController {

  jwtService = new JwtService();
  userDao = new UserDao();


  @Post("/signup")
  @UseInterceptors(SetCookieWhenCode1AndResHasCookieInterceptor)
  async signUp(@Body('userId') userId: number) {
    if (!userId) {
      return {
        code: ErrCode.INVALID_PARAM,
        message: '缺少 userId 参数'
      }
    }

    try {
      const userInfo = await this.userDao.queryById({ id: userId })
      if (!userInfo) {
        return {
          code: ErrCode.USER_NOT_EXIST,
          message: '用户不存在，请先注册/创建用户'
        }
      }

      const token = await this.jwtService.updateFingerprint(userId)
      Logger.info(`[open-api: signup] 用户 ${userId} 登录完成.`);
      return {
        code: ErrCode.SUCCESS,
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
      Logger.error(`[open-api: signup] 未知错误 ${ex?.stack?.toString?.()} `);
      return {
        code: ErrCode.ERROR,
        message: ex.message,
      };
    }
  }
}
