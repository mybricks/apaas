import axios, { AxiosRequestConfig } from 'axios';
import type { Request, Response } from 'express';

import { AccessTokenResult, RidInfo, SessionResult, PhoneNumberResult } from './miniapp.types'

export class MiniAppService {

  private options = {
    appId: undefined,
    secret: undefined
  };

  constructor () {}

  /**
   * 获取接口调用凭据
   * 
   * 获取小程序全局唯一后台接口调用凭据，token有效期为7200s，开发者需要进行妥善保存。
   * 
   * @param appId 
   * @param secret 
   * @returns 
   */
  public getAccessToken (appId?: string, secret?: string) {
    if (!appId || !secret) {
      appId = this.options?.appId;
      secret = this.options?.secret;
    }
    const url = 'https://api.weixin.qq.com/cgi-bin/token';
    // eslint-disable-next-line camelcase
    return axios.get<AccessTokenResult>(url, { params: { grant_type: 'client_credential', appid: appId, secret } });
  }

  /**
   * 查询rid信息
   * @param {string} rid 
   * @param {string} accessToken 
   * @returns 
   * @link https://developers.weixin.qq.com/doc/oplatform/Third-party_Platforms/2.0/api/openApi/get_rid_info.html
   */
  public getRid (rid: string, accessToken: string) {
    const url = `https://api.weixin.qq.com/cgi-bin/openapi/rid/get?access_token=${accessToken}`;
    return axios.post<RidInfo>(url, {
      rid,
    });
  }

  /**
   * 登录
   * @param code 临时登录凭证
   * @param appId 小程序 appId
   * @param secret 小程序 appSecret
   * @returns 
   * @link https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/login/auth.code2Session.html
   */
  public async code2Session (code: string, appId?: string, secret?: string): Promise<SessionResult> {
    if (!appId || !secret) {
      appId = this.options?.appId;
      secret = this.options?.secret;
    }

    if (!appId || !secret) {
      throw new Error(`${MiniAppService.name}': No appId or secret.`);
    } else {
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
      return (await axios.get<SessionResult>(url)).data;
    }
  }

  /**
   * 获取手机号
   * @param {string} accessToken 小程序调用token，第三方可通过使用authorizer_access_token代商家进行调用
   * @param {string} code 手机号获取凭证，小程序端获取
   * @returns 
   * @link https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-info/phone-number/getPhoneNumber.html
   * @link https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/getPhoneNumber.html
   */
  public getPhoneNumber (code: string, accessToken: string) {
    const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`;
    return axios.post<PhoneNumberResult>(url, { code });
  }
}