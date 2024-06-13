/**
 * @description 注意！！！ 本文件仅做参考使用，服务实际上并不会加载本文件，仅会加载config、config.development 以及 config.production 名称文件
 */

module.exports = {
  /**
   * @description 必填 数据库配置，目前仅支持 mysql 数据库
   */
  database: {
    dbType: 'MYSQL',
    host: '',
    user: '',
    password: '',
    port: 3000,
    database: ''
  },
  /**
   * @description 必填 平台配置 
  */
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
     * @description [可选项] 如果是容器化技术必填，各类持久化文件的读写位置，不填写时默认取当前路径的根目录，使用绝对路径
     */
    exteralFilesStoragePath: '',
    /**
     * @description [可选项] 建议设置，用于登录的时候生成jwt token的 加盐值或者私钥，可以填写一个不容易生成的随机值
     */
    jwtSecretOrPrivateKey: '',
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
    logo: '',
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
  },
  /**
   * @description [可选项] 平台开放接口的配置，没有用到openApi可以不需要配置
   */
  openApi: {
    /**
     * @description 生成 openApi token所使用的私钥
     */
    tokenSecretOrPrivateKey: '',
    /**
     * @description 授权的开放应用
     */
    accessApps: [
      {
        /**
         * @description 应用的唯一标识
         */
        appId: ''
      }
    ]
  }
}
