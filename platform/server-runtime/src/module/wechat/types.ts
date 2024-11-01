export interface DefaultRequestResult {
  errcode: number;
  errmsg: string;
}

/**
 * 登录凭证校验
 *
 * Result of auth.code2Session
 */
export interface SessionResult {
  /**
   * 用户唯一标识
   */
  openid: string;
  /**
   * 会话密钥
   */
  session_key: string;
  /**
   * 用户在开放平台的唯一标识符，若当前小程序已绑定到微信开放平台帐号下会返回，详见 UnionID 机制说明。
   */
  unionid?: string;
  /**
   * 错误码
   */
  errcode?: number;
  /**
   * 错误信息
   */
  errmsg?: string;
}

/**
 * 获取手机号码返回结果
 */
export interface PhoneNumberResult extends DefaultRequestResult {
  /**
   * 用户手机号信息
   */
  phone_info: {
    /**
     * 用户绑定的手机号（国外手机号会有区号）
     */
    phoneNumber: string;
    /**
     * 没有区号的手机号
     */
    purePhoneNumber: string;
    /**
     * 区号
     */
    countryCode: number;
    /**
     * 数据水印
     */
    watermark: {
      /**
       * 用户获取手机号操作的时间戳
       */
      timestamp: number;
      /**
       * 小程序appid
       */
      appid: string;
    };
  };
}