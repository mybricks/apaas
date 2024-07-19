const fse = require('fs-extra')
const path = require('path')
const env = require('./../env')

function validatePath (localPath) {
  if (typeof localPath !== 'string') {
    throw new Error('externalFilesStoragePath 必须为字符串')
  }

  if (localPath.trim() === '') {
    throw new Error('externalFilesStoragePath 不可以配置空字符串')
  }

  if (!fse.pathExistsSync(localPath)) {
    throw new Error(`externalFilesStoragePath 当前配置为 ${localPath}，这是一个无法正常访问的目录`)
  }
}

module.exports.validateFilStoragePath = async function ({ console }) {
  validatePath(env.FILE_LOCAL_STORAGE_BASE_FOLDER)
  console.log(`即将更新预设资源到 ${env.FILE_LOCAL_STORAGE_BASE_FOLDER}`)
}