import { DefaultRequestResult } from './types';

export * from './types'

/**
 * 获取接口调用凭据参数
 * 
 * 错误码
 * + -1	system error 系统繁忙，此时请开发者稍候再试
 * + 40001 invalid credential  access_token isinvalid or not latest	获取 access_token 时 AppSecret 错误，或者 access_token 无效。请开发者认真比对 AppSecret 的正确性，或查看是否正在为恰当的公众号调用接口
 * + 40013 invalid appid	不合法的 AppID ，请开发者检查 AppID 的正确性，避免异常字符，注意大小写
 */
export interface AccessTokenResult extends DefaultRequestResult {
  /**
   * 获取到的凭证
   */
  access_token?: string;
  /**
   * 凭证有效时间，单位：秒。目前是7200秒之内的值。
   */
  expires_in?: number;
}

/**
 * 微信接口调用rid查询
 */
export interface RidInfo extends DefaultRequestResult {
  /**
   * 该 rid 对应的请求详情
   */
  request: RequestInfo;
}