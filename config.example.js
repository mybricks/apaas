/**
 * @description 注意！！！ 本文件仅做参考使用，服务实际上并不会加载本文件，仅会加载config、config.development 以及 config.production 名称文件
 */

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
     * @description 必填 pm2 进程名字
     */
    appName: 'mybricks-apaas',
    /**
     * @description 必填 服务端口号
     */
    port: 6666,
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
    /**
     * @description [可选项] 指定平台运行时动态安装应用时如何安装应用的node_modules依赖，默认值为 npm i --registry=https://registry.npmmirror.com --production
     */
    installCommand: 'npm i --registry=https://registry.npmmirror.com --production'
  },
  /**
   * @description [可选项] 管理员账号与密码，初始化数据库时会使用此账号密码
   */
  adminUser: {
    email: '',
    password: '',
  }
}
