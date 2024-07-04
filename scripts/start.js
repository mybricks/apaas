const fse = require('fs-extra')
const path = require('path')
const childProcess = require('child_process')

const { PLATFORM_SERVER_PATH } = require('./env')
const Log = require('./utils/log')
const { pm2Check } = require('./utils/pm2-check')

const envLog = Log('MyBricks: 部署环境检测')

;(async () => {
  await pm2Check({ console: envLog });

  childProcess.execSync(`npm run start:prod`, {
    stdio: 'inherit',
    cwd: PLATFORM_SERVER_PATH
  })
})().catch(err => {
  envLog.error(err?.message ?? '未知错误')
  envLog.error('启动环境已终止')
  process.exit()
});
