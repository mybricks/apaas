/**
 * @description shared 文件后续可以抽成通用的方法，主要目的是平台前后端、脚本共用的代码
 */


const readUserConfig = require('./read-user-config');
const readPlatformPackageJson = require('./read-package-json')
const loadApps = require('./load-apps');
const MySqlExecutor = require('./mysql-executor');
const { verifyAccessToken } = require('./access-token');
const { getPM2Version, getNodeVersion } = require('./pm2')

module.exports = {
  MySqlExecutor,
  readUserConfig,
  readPlatformPackageJson,
  loadApps,
  accessToken: {
    verifyAccessToken
  },
  getPM2Version,
  getNodeVersion,
}