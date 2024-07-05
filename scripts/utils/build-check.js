const fse = require('fs-extra')
const path = require('path')

const { PLATFORM_FE_PATH } = require('./../env')


module.exports.buildAssetsCheck = async ({ console }) => {
  console.log('检查平台前端产物中...')

  const platformBuildAssetsPath = path.join(PLATFORM_FE_PATH, 'assets');

  if (!await fse.pathExists(platformBuildAssetsPath)) {
    throw new Error('平台前端产物未构建，请先执行 npm run build 构建')
  }

  console.log('平台前端产物已构建')
}