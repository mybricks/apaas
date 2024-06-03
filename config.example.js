
module.exports = {
  /**
   * @description 数据库配置，目前仅支持 mysql 数据库
   */
  database: {
    dbType: 'MYSQL',
    host: '',
    user: '',
    password: '',
    port: 3000,
    database: ''
  },
  /** 平台配置 */
  platformConfig: {
    /** 
     * @description [可选项] 网站前端各个位置的标题文案
     */
    title: 'MyBricks开放应用平台',
    /**
     * @description [可选项] 网站前端页面的 favicon，支持http链接以及base64
     */
    favicon: '',
    /**
     * @description [可选项] 网站页面内的平台图标，支持http链接以及base64
     */
    icon: '',
  },
  /**
   * @description [可选项] 管理员账号与密码，初始化数据库时会使用此账号密码
   */
  adminUser: {
    email: '',
    password: '',
  }
}
