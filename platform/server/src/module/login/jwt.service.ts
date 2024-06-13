import { Logger } from '@mybricks/rocker-commons';
import { Inject, Injectable, Request } from '@nestjs/common';
import UserSessionDao from './../../dao/UserSessionDao';
import FileDao from './../../dao/FileDao';
import * as jwt from 'jsonwebtoken';
const userConfig = require('./../../../../../scripts/shared/read-user-config.js')();

@Injectable()
export default class JwtService {
  // userDao: UserDao;
  userSessionDao: UserSessionDao;

  fileDao: FileDao;

  private loginSecret: string = userConfig?.platformConfig?.jwtSecretOrPrivateKey ?  userConfig?.platformConfig?.jwtSecretOrPrivateKey : 'login_mybricks_asdw21412asdds';

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
    headerUsername,
    request,
  }: {
    headerUsername?: string;
    request: Request;
  }) {
    let userEmail;
    let userId;


    if(headerUsername) {
      userEmail = `${headerUsername}@kuaishou.com`;
    }

    let cookieInfo = null
    try {
      cookieInfo = request?.cookies?.['mybricks-login-user'] ? JSON.parse(request?.cookies?.['mybricks-login-user']) : null;
      userId = cookieInfo?.id;
    } catch (error) {
      
    }

    // 多次登录
    if(cookieInfo?.fingerprint) {
      const sess = await this.userSessionDao.queryByUserId({ userId: cookieInfo.id })
      if(sess?.fingerprint !== cookieInfo.fingerprint) {
        throw new Error('当前账号已在其他设备登录，请重新登录')
      }
    }

    return {
      userEmail,
      userId
    }
  }
}
