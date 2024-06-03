const path = require('path');
const fse = require('fs-extra');

const ROOT_PATH = path.join(__dirname, './../../');
const SUPPORT_TYPE = ['.js', '.json']

function getConfigByFileName (fileName) {
  let extname = undefined;
  let index = 0;
  let filePath = null;
  while (index < SUPPORT_TYPE.length && !filePath) {
    extname = SUPPORT_TYPE[index];
    const curPath = path.join(ROOT_PATH, fileName + extname)
    if (fse.existsSync(curPath)) {
      filePath = curPath
    }
    index++
    continue
  }

  if (!filePath) {
    return null
  }
  if (path.extname(filePath) === '.json') {
    return fse.readJSONSync(filePath, { encoding: 'utf-8' })
  }
  if (path.extname(filePath) === '.js') {
    return require(filePath)
  }
  return null
}

module.exports = function () {
  let userConfig = null;

  if (process.env.NODE_ENV === "development") {
    userConfig = getConfigByFileName('config.development');
  }
  if (!userConfig) {
    userConfig = getConfigByFileName('config.production');
  }

  if (!userConfig) {
    userConfig = getConfigByFileName('config');
  }

  if (!userConfig) {
    throw new Error('[Mybricks平台启动检查] 未找到平台配置文件，请检查配置')
  }

  validatePlatform(userConfig);
  validateDatabase(userConfig);

  return userConfig
}

function validatePlatform (config) {
  if (!config?.platformConfig) {
    throw new Error('[Mybricks平台启动检查] 平台配置不存在，请配置 platformConfig')
  }
}

function validateDatabase (config) {
  if (!config?.database) {
    throw new Error('[Mybricks平台启动检查] 数据库配置不存在')
  }

  if (!config?.database?.database) {
    throw new Error('[Mybricks平台启动检查] 数据库配置 database 未配置')
  }

  if (!config?.database?.host) {
    throw new Error('[Mybricks平台启动检查] 数据库配置 host 未配置')
  }

  if (!config?.database?.user) {
    throw new Error('[Mybricks平台启动检查] 数据库配置 user 未配置')
  }

  if (config?.database?.dbType?.toUpperCase() !== 'MYSQL') {
    throw new Error(`[Mybricks平台启动检查] 数据库需要为MYSQL，当前配置为${config.database.dbType}`)
  }
}

