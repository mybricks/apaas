const fse = require('fs-extra')
const path = require('path')
const childProcess = require('child_process')

const { isYarnExist, loadApps } = require('./shared')

const { PLATFORM_FE_PATH, PLATFORM_SERVER_PATH } = require('./env')

function installDepsInDir (dir) {
  if(isYarnExist()) {
    childProcess.execSync(`yarn`, {
      stdio: 'inherit',
      cwd: dir
    })
  } else {
    childProcess.execSync(`npm install`, {
      stdio: 'inherit',
      cwd: dir
    })
  }
}

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


