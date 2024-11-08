const fse = require('fs-extra')
const path = require('path')
const childProcess = require('child_process')

const { RUNTIME_SERVER_PATH } = require('./env')
const Log = require('./utils/log')
const { pm2Check } = require('./utils/pm2-check')

const envLog = Log('MyBricks运行容器: 部署环境检测')

;(async () => {
  await pm2Check({ console: envLog });
  childProcess.execSync(`NODE_ENV=production pm2 start ecosystem.config.js --no-daemon`, {
    stdio: 'inherit',
    cwd: RUNTIME_SERVER_PATH
  })
})().catch(err => {
  envLog.error(err?.message ?? '未知错误')
  envLog.error('启动环境已终止')
  process.exit()
});
