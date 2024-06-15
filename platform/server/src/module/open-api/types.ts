export enum OpenApiErrCode {
  /** 成功 */
  SUCCESS = 1,

  /** 未知错误 */
  ERROR = -1,

  /** 服务器未配置openApi相关配置 */
  CONFIG_NOT_FOUND= 40001,

  /** token错误或失效 */
  INVALID_TOKEN = 40002,

  /** 非法参数 */
  INVALID_PARAM = 40003,

  /** 用户不存在 */
  USER_NOT_EXIST = 46004,
}