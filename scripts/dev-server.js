const childProcess = require('child_process')

const { PLATFORM_SERVER_PATH } = require('./env')
const Log = require('./utils/log')

const validateEnv = require('./utils/validate-env');

const envLog = Log('MyBricks: 启动环境检测')

;(async () => {
  await validateEnv({ console: envLog });
  envLog.log('环境检测完毕，准备启动调试服务')

  childProcess.execSync(`npm run start:watch`, {
    stdio: 'inherit',
    cwd: PLATFORM_SERVER_PATH
  })
})();