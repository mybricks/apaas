import { Logger } from '@mybricks/rocker-commons';
import { Inject, Injectable } from '@nestjs/common';
import UserSessionDao from './../../dao/UserSessionDao';
import FileDao from './../../dao/FileDao';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express'
import { configuration } from './../../utils/shared'

@Injectable()
export default class JwtService {
  // userDao: UserDao;
  userSessionDao: UserSessionDao;

  fileDao: FileDao;

  private loginSecret: string = configuration?.platformConfig?.jwtSecretOrPrivateKey ?  configuration?.platformConfig?.jwtSecretOrPrivateKey : 'login_mybricks_asdw21412asdds';

  constructor() {
    this.fileDao = new FileDao();
    this.userSessionDao = new UserSessionDao();
  }

  private async createLoginJwtToken(payload) {
    const token =
      "Bearer " +
      jwt.sign(payload, this.loginSecret, {
        expiresIn: 60 * 60 * 24 * 90, // seconds unit
      });
    return token;
  }

  async verifyLoginJwtToken(token: string, callback) {
    jwt.verify(token, this.loginSecret, callback)
  }

  public async updateFingerprint(userId) {
    const token = await this.createLoginJwtToken({ userId, birthTime: Date.now() })
    const sess = await this.userSessionDao.queryByUserId({ userId });
    if (sess) {
      await this.userSessionDao.updateFingerprintByUserId({ userId, fingerprint: token });
    } else {
      await this.userSessionDao.create({ userId, fingerprint: token })
    }
    return token
  }


  public async verifyUserIsLogin ({
    request,
  }: {
    request: Request;
  }) {
    let userEmail;
    let userId;


    if(request.headers?.['username']) {
      userEmail = request.headers?.['username'];
    }

    let cookieInfo = null
    try {
      cookieInfo = request?.cookies?.['mybricks-login-user'] ? JSON.parse(request?.cookies?.['mybricks-login-user']) : null;
      userId = cookieInfo?.id;
    } catch (error) {
      Logger.error(`[登录态校验] 获取登录态失败，cookie信息为 ${request?.cookies?.['mybricks-login-user']}`)
    }

    // 防止多次登录
    if(cookieInfo?.fingerprint && configuration?.platformConfig?.forbidRepeatLogin) {
      const sess = await this.userSessionDao.queryByUserId({ userId: cookieInfo.id })
      if(sess?.fingerprint !== cookieInfo.fingerprint) {
        throw new Error('当前账号已失效，请重新登录')
      }
    }

    return {
      userEmail,
      userId
    }
  }
}
