const fse = require('fs-extra')
const { execSync } = require('child_process');

const { getPM2Version } = require('./../shared/pm2')

module.exports.pm2Check = async function ({ console }) {
  console.log('检查 PM2 中...')

  let hasPm2 = false
  try {
    console.log(`当前使用的 PM2 版本为 ${getPM2Version()}`);
    hasPm2 = true
  } catch (error) {
    hasPm2 = false
  }

  if (!hasPm2) {
    throw new Error('当前全局环境无 PM2，请手动安装 PM2，比如 npm i -g pm2')
  }
}

module.exports.pm2CheckAndAutoInstall = async function ({ console }) {
  console.log('检查 PM2 中...')

  let hasPm2 = false
  try {
    console.log(`当前使用的 PM2 版本为 ${getPM2Version()}`);
    hasPm2 = true
  } catch (error) {
    hasPm2 = false
  }

  if (!hasPm2) {
    try {
      console.log('当前全局环境无 PM2，执行 npm i -g pm2 --registry=https://registry.npmmirror.com 自动安装中...')
      execSync('npm i -g pm2 --registry=https://registry.npmmirror.com', { stdio: 'inherit', encoding: 'utf-8' });
    } catch (error) {
      throw new Error('自动安装 PM2 失败，请手动安装 PM2')
    }
  }

}