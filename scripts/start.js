const fse = require('fs-extra')
const path = require('path')
const childProcess = require('child_process')

const { PLATFORM_SERVER_PATH } = require('./env')
const Log = require('./utils/log')

const envLog = Log('MyBricks: 部署环境检测')

;(async () => {
  childProcess.execSync(`npm run start:prod`, {
    stdio: 'inherit',
    cwd: PLATFORM_SERVER_PATH
  })
})();
