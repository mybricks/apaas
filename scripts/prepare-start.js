const Log = require('./utils/log')

const validateEnv = require('./utils/validate-env');

const envLog = Log('MyBricks: 线上部署环境准备')

;(async () => {
  await validateEnv({ console: envLog });
  envLog.log('🎉 部署环境准备完毕，可以通过 start 脚本启动服务器')
})();
