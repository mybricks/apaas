const fse = require('fs-extra');
const path = require('path')

const getConfig = () => {
  let config
  try {
    config = fse.readJsonSync(path.join(__dirname, './../../config.json'), 'utf-8')
  } catch (error) {}
  if (!config || !config?.appName || !config?.port) {
    throw new Error('config.json 配置不存在或者有误')
  }
  return config
}

const readConfig = () => {
  // 平台一体化启动时可以找到的路径
  try {
    const env = require('./../../../../scripts/env');
    const userConfig = require('./../../../../scripts/shared/read-user-config')();
    return {
      appName: userConfig?.platformConfig?.appName + '_runtime',
      port: userConfig?.runtimeConfig?.port, // TODO， 后面在 platformConfig 那里找个地方配置吧
      FILE_LOCAL_STORAGE_BASE_FOLDER: env.FILE_LOCAL_STORAGE_BASE_FOLDER,
      FILE_LOCAL_STORAGE_FOLDER: env.FILE_LOCAL_STORAGE_FOLDER
    }
  } catch (error) {
  }

  // 默认路径
  const FILE_LOCAL_STORAGE_BASE_FOLDER = path.resolve(__dirname, './../../');

  const config = getConfig();
  return {
      ...(config ?? {}),
    FILE_LOCAL_STORAGE_BASE_FOLDER,
    FILE_LOCAL_STORAGE_FOLDER: path.join(FILE_LOCAL_STORAGE_BASE_FOLDER, '_localstorage')
  }
}



module.exports = readConfig();

