import {
  Get,
  Controller,
  Body,
  Post,
  Param,
  Headers,
  Query,
  Request,
  Res,
  Req,
} from '@nestjs/common';
import { Response } from 'express'
import FileDao from '../../dao/FileDao';
import UserDao from '../../dao/UserDao';
import { Logs } from '../../utils';
import UserService from './../user/user.service';
import JwtService from './jwt.service';
import { Logger } from '@mybricks/rocker-commons';
import { getAxiosInstance } from '@mybricks/sdk-for-app/api/util';
import { USER_ROLE } from '../../constants'
import UserSessionDao from './../../dao/UserSessionDao';

@Controller('/paas/api/user')
export default class LoginController {
  fileDao: FileDao;
  userDao: UserDao;
  userService: UserService;
  jwtService = new JwtService();
  userSessionDao: UserSessionDao;

  constructor() {
    this.fileDao = new FileDao();
    this.userDao = new UserDao();
    this.userService = new UserService();
    this.userSessionDao = new UserSessionDao();
  }
  

  @Post('/grant')
  async grantLisence(@Body() body) {
    const { email } = body;
    if (email) {
      const flag = await this.userDao.grantLisenseCode({ email });
      if (flag) {
        return {
          code: 1,
        };
      } else {
        return {
          code: 1,
          data: null,
        };
      }
    } else {
      return {
        code: -1,
        msg: 'email expected.',
      };
    }
  }

  @Post('/register')
  async register(@Body() body) {
    const { email, psd, captcha } = body;

    if (
      !email ||
      !email.match(/^[a-zA-Z\d.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z\d](?:[a-zA-Z\d-]{0,61}[a-zA-Z\d])?(?:\.[a-zA-Z\d](?:[a-zA-Z\d-]{0,61}[a-zA-Z\d])?)*$/) ||
      !psd ||
      /** 存在环境变量，代表使用邮箱验证码校验 */
      (process.env.MYBRICKS_EMAIL_ACCESS_KEY_ID ? !captcha : false)
    ) {
      return {
        code: -1,
        msg: `数据错误.`,
      };
    }

    Logs.info(`用户${email} 申请注册.`);

    const user = await this.userDao.queryByEmail({ email });
    if (user) {
      Logs.info(`邮箱${email}已被注册.`);

      return {
        code: -1,
        msg: `邮箱${email}已被注册.`,
      };
    } else {
      /** 存在环境变量，代表使用邮箱验证码校验 */
      if (process.env.MYBRICKS_EMAIL_ACCESS_KEY_ID) {
        const captchaItem = await queryCaptchaByUserId({ type: 'email', timeInterval: (10 * 60) * 1000, userId: email });
        if (!captchaItem || captcha !== captchaItem.captcha) {
          return { code: -1, msg: '验证码错误，请重新发送验证码' };
        }
      }
      const { id } = await this.userDao.create({
        email,
        password: psd,
      });

      // 刷新登录信息
      const fingerprint = await this.jwtService.updateFingerprint(id)

      Logs.info(`新用户${email}注册完成.`);

      return {
        code: 1,
        data: {
          id,
          email,
          fingerprint,
        },
      };
    }
  }

  /** [TODO] 为了给登录应用调用的路由，不合理 */
  @Post('/loginByWechat')
  async loginByWechat(@Body() body) {
    const { userId, wechatOpenId } = body;

    const fingerprint = await this.jwtService.updateFingerprint(userId)

    Logs.info(`用户${wechatOpenId}登录完成.`);

    return {
      code: 1,
      data: {
        id: userId,
        email: '',
        wechatOpenId,
        fingerprint,
      },
    };
  }

  /** [TODO] 为了给登录应用调用的路由，不合理 */
  @Post('/registerByWechat')
  async registerByWechat(@Body() body) {
    const { name, wechatOpenId } = body;
    const { id, email } = await this.userDao.create({
      email: '',
      name,
    });

    const fingerprint = await this.jwtService.updateFingerprint(id)

    Logs.info(`新用户${wechatOpenId}注册完成.`);

    return {
      code: 1,
      data: {
        id,
        email,
        wechatOpenId,
        fingerprint,
      },
    };
  }

  @Post('/login')
  async login(@Body() body) {
    const { email, psd } = body;

    Logs.info(`用户${email} 申请登录.`);

    const user = await this.userDao.queryByEmailWithPwd({ email })
    if (user) {
      if (user.verifyPassword(psd)) {
        Logs.info(`用户${email} 登录成功.`);
        const fingerprint = await this.jwtService.updateFingerprint(user.id)

        return {
          code: 1,
          data: Object.assign({}, {
            id: user.id,
            email: user.email,
            fingerprint
          }),
        };
      } else {
        return {
          code: -1,
          msg: `用户名或密码错误.`,
        };
      }
    } else {
      return {
        code: -1,
        msg: `用户名或密码错误.`,
      };
    }
  }

  @Post('/logout')
  async logout (@Res() response: Response) {
    // 清除 cookie
    response.clearCookie('mybricks-login-user', { secure: true });
    response.clearCookie('mybricks-login-user', { secure: false })
    response.clearCookie('mybricks-login-user', { path: '/*', secure: true })
    response.clearCookie('mybricks-login-user', { path: '/*', secure: false })
    // 返回成功响应
    return response.status(200).json({ message: '登出成功' });
  }

  @Post('/updateUser')
  async updateUser(@Body() body) {
    const { email, password } = body;

    return {
      code: 1,
      message: '',
      data: await this.userDao.updateUser({ email, password }),
    };
  }

  /**
   * 已登录用户
   */
  @Post('/signed')
  async signed(@Body() body, @Headers('username') us: string, @Request() request) {
    try {
      const { fileId } = body;

      const { userEmail, userId } = await this.jwtService.verifyUserIsLogin({ request, headerUsername: us })

      if (!userEmail && !userId) {
        // 都没带的情况下，才是游客，直接判断
        if(request?.headers?.referer?.indexOf('.html') > -1 && request?.headers?.referer?.indexOf('id=') > -1) {
          const temp = require('url').parse(request?.headers?.referer, true)
          const fileId = temp.query?.id
          if(fileId) {
            const fileInfo = await this.fileDao.queryById(fileId)
            if([10, 11].includes(+fileInfo?.shareType)) {
              Logger.info(`[signed] 命中访客模式，直接返回`);
              return {
                code: 1,
                data: {
                  name: '游客',
                  email: 'guest@mybricks.world'
                },
              }
            }
          }
        }
      }

      if (!userEmail && !userId) {
        return {
          code: -1,
          msg: '未登录，请重新登录',
        };
      }

      let userInfo
      if (userEmail) {
        userInfo = await this.userDao.queryByEmail({
          email: userEmail,
        });
      } else if (userId) {
        userInfo = await this.userDao.queryById({ id: userId })
      }

      if (userInfo) {
        const data: any = {
          ...userInfo,
          isAdmin: userInfo.role === USER_ROLE.ADMIN,
        }
        delete data.password;
        delete data.mobilePhone;
        if (fileId) {
          const roleDescription = await this.fileDao.getRoleDescription({userId: userInfo.id, fileId})
          data.roleDescription = roleDescription
        }
        
        return {
          code: 1,
          data,
        };
      } else {
        return {
          code: -1,
          msg: '用户不存在，请重新登录',
        };
      }
    } catch(e) {
      Logger.info(e.message)
      Logger.info(e?.stack?.toString())
      return {
        code: -1,
        msg: e.message || '获取用户态失败'
      }
    }
  }

  @Post('/queryCurrentSession')
  async queryCurrentSession(@Headers('username') us: string, @Request() request) {
    try {
      const { userEmail, userId } = await this.jwtService.verifyUserIsLogin({ request, headerUsername: us })
      if (userEmail || userId) {
        return {
          code: 1
        }
      }

      if (!userEmail && !userId) {
        return {
          code: -1,
          msg: '当前用户未登录'
        }
      }
    } catch (error) {
      return {
        code: -2,
        msg: error?.message ?? '登录已失效，请重新登录'
      }
    }
    
    return {
      code: -1,
      msg: '未知错误'
    }
  }
}

function queryCaptchaByUserId(params: { type: string; userId: number, timeInterval: number }): Promise<any> {
  return new Promise((resolve, reject) => {
    getAxiosInstance()
      .post('/api/login/queryCaptchaByUserId', params)
      .then(({ data }: any) => {
        resolve(data)
      })
      .catch((e: any) => {
        reject(e.msg || '查询验证码失败')
      })
  });
}
