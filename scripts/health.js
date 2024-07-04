
const Log = require('./utils/log')
const { loadApps } = require('./shared')
const envLog = Log('MyBricks: 健康检查')


;(async () => {
  envLog.log('开始健康检查')
  envLog.log('当前加载app如下：')
  envLog.log(JSON.stringify(loadApps()));
  envLog.log('健康检查完毕')
})();
