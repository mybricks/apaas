const childProcess = require('child_process')

const { PLATFORM_SERVER_PATH } = require('./env')
const Log = require('./utils/log')

const startInitDatabase = require('./utils/database/init')

const envLog = Log('MyBricks: 开发环境检测')

;(async () => {
  await startInitDatabase({ console: envLog });
  envLog.log('环境检测完毕，准备启动调试服务')

  childProcess.execSync(`npm run start:dev`, {
    stdio: 'inherit',
    cwd: PLATFORM_SERVER_PATH
  })
})();