const fse = require('fs-extra')
const path = require('path')
const childProcess = require('child_process')

const { loadApps } = require('./shared')

const { pm2CheckAndAutoInstall } = require('./utils/pm2-check');

const Log = require('./utils/log')

const envLog = Log('MyBricks: 启动脚本')

const { PLATFORM_FE_PATH, PLATFORM_SERVER_PATH } = require('./env')

const installCommand = 'npm i --registry=https://registry.npmmirror.com';

envLog.log(`准备安装所有项目的依赖，安装命令使用 ${installCommand}`)

function installDepsInDir (dir) {
  childProcess.execSync(installCommand, {
    stdio: 'inherit',
    cwd: dir
  })
}

;(async () => {
  // 平台前端安装依赖
  installDepsInDir(PLATFORM_FE_PATH);

  // 平台服务端安装依赖
  installDepsInDir(PLATFORM_SERVER_PATH);

  // 扫描是否有本地APP
  const apps = loadApps();
  // 本地APP安装依赖
  for (let index = 0; index < apps.length; index++) {
    const app = apps[index];
    if (app.hasFe) { // 目前只有前端源码项目需要安装
      installDepsInDir(app.directory);
    }
  }

  // 检查并自动安装pm2
  await pm2CheckAndAutoInstall({ console: envLog })

  envLog.log('🎉 所有依赖已安装完成')
})().catch(err => {
  envLog.error(err?.message ?? '未知错误')
  envLog.error('操作已终止')
  process.exit()
});
