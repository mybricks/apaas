

<p align="center">
  <a href="https://mybricks.world" target="blank"><img src="https://docs.mybricks.world/img/logo.png" width="90" alt="MyBricks APaaS Logo" /></a>
</p>

<h1 align="center">MyBricks aPaaS 平台</h1>

<p align="center">
  开源、支持私有化部署的低代码开发平台
</p>


# 快速体验
访问在线版 [MyBricks aPaaS平台](https://my.mybricks.world/) 搭建专属于您的 中后台页面、门户网站、小程序、H5等。
<br/>
<br/>

# 简介
本Git项目包含了MyBricks aPaaS（与在线版等同）的所有代码，您也可以快速部署专属您自己的低代码开发平台。
<br/>
<br/>

# 平台部署

### 0.前置条件
请确保环境内
- 已安装有 **Node 14+（推荐v14.21.0）**、**npm**或者**yarn**等包管理工具，推荐 npm 7.x 以上
- 配置并启动了数据库环境，**MySql 5.7 以上**，如果安装的是 MySQL8.x，注意密码加密方式设置为：Legacy Password Encryption，切记不要设置为 Strong Password Encryption

### 1.下载源码
```
git clone https://github.com/mybricks/apaas.git my-apaas
```

### 2.切换目录
```
cd my-apaas
```

### 3.安装依赖
```
npm install
```

> 如果npm版本太低可能会无法触发一键安装钩子，建议升级到npm 7.x以上。
> 如若无法升级npm版本，可以手动调用 npm run postinstall 来安装依赖

### 4.配置环境变量
在 **项目根目录下** 参考 `config.example.js` 创建 `config.js` 文件，并配置以下环境变量
``` javascript
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
    port: 3102,
    /**
     * @description [可选项] 如果是容器化技术必填，各类持久化文件的读写位置，不填写时默认取当前路径的根目录，使用绝对路径
     */
    externalFilesStoragePath: '',
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
  }
}
```
> config文件支持区分开发 / 生产环境，开发环境优先取`config.development.js`，生产环境则优先取`config.production.js`


### 5.部署平台
在 **生产环境** 下部署平台

[可选操作] 环境检测，建议第一次部署都执行一下
```bash
# 脚本会执行以下操作
# 1. 检测生产环境的各类环境信息和配置是否符合规范，
# 2. 在 配置了数据库且数据库以及表不存在 的情况下，初始化数据库和表，同时会将 adminUser 信息添加为管理员
# 3. 将预置的 静态资源 下载并复制到 externalFilesStoragePath 下，如果没配置则是默认路径

npm run prepare:start
```

>什么时候需要重新执行此命令？
>1. 数据库刚配置好，需要初始化表
>2. adminUser 刚配置好，需要添加管理员信息到数据库
>3. 配置了 externalFilesStoragePath 后，需要将预置的静态资源复制到指定位置


编译 / 构建产物
```
npm run build
```
启动
```
npm run start
```

> 启动后服务将使用 pm2 来管理服务，可以使用 pm2 的各类命令

### 可供参考的NG配置
下面主要列出一些需要关注的配置项

```nginx
client_max_body_size 200m; # 限制上传大小为 200MB

location / {
  #... 以上省略通用配置信息

  # 缓存相关，将信息带到原始服务器，用于协商缓存
  proxy_pass_header Cache-Control;
  proxy_pass_header Expires;
  proxy_pass_header ETag;
  proxy_pass_header Last-Modified;
  proxy_set_header If-Modified-Since $http_if_modified_since;
  proxy_set_header If-None-Match $http_if_none_match;

  # Gzip相关配置
  gzip on;
  # 启用 Gzip 压缩的最小文件大小。对所有大于 1k 的文件启用压缩，文件太小压缩后反而可能变大
  gzip_min_length 1k;
  gzip_http_version 1.1;
  # 压缩等级，1 表示最快速（但压缩比最低），9 表示最慢（但压缩比最高）
  gzip_comp_level 2;
  gzip_types text/css application/javascript text/javascript text/plain application/json application/xml;
  # 是否在 HTTP 响应头中添加 Vary: Accept-Encoding
  gzip_vary on;
  gzip_proxied   expired no-cache no-store private auth;
  gzip_disable   "MSIE [1-6]\.";
}
```
<br/>
<br/>

## 关注我们，获取更多支持
<div style="display:flex;justify-content: center">
<img style="width: 200px; margin:0px auto;" src="https://assets.mybricks.world/files/534065092341829/YDbNRhFeeyeMorgGiODjgNFTYMhnivh2-1708313464390.jpeg" />

</div>


## 了解更多
- [MyBricks 官网](https://mybricks.world/)
- [MyBricks 文档](https://docs.mybricks.world/)
- [MyBricks 在线版](https://my.mybricks.world/)
- [VSCode 插件 开发者工具](https://marketplace.visualstudio.com/items?itemName=Mybricks.Mybricks)