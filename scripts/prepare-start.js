const Log = require('./utils/log')

const validateEnv = require('./utils/validate-env');

const assetsUpdate = require('./utils/assets-update');

const envLog = Log('MyBricks: 线上部署环境准备')

;(async () => {
  await validateEnv({ console: envLog });
  await assetsUpdate({ console: envLog })
  envLog.log('🎉 部署环境准备完毕，可以通过 start 脚本启动服务器')
})();
