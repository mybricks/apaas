const Log = require('./utils/log')

const { pm2CheckAndAutoInstall } = require('./utils/pm2-check');

const assetsUpdate = require('./utils/assets-update');

const startInitDatabase = require('./utils/database/init')

const { buildAssetsCheck } = require('./utils/build-check')

const envLog = Log('MyBricks: 线上部署环境准备')

;(async () => {
  await pm2CheckAndAutoInstall({ console: envLog });
  await startInitDatabase({ console: envLog });
  await assetsUpdate({ console: envLog })
  await buildAssetsCheck({ console: envLog })
  envLog.log('🎉 部署环境准备完毕，可以通过 start 脚本启动服务器')
})().catch(err => {
  envLog.error(err?.message ?? '未知错误')
  envLog.error('操作已终止')
  process.exit()
});
