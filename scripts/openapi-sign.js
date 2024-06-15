const Log = require('./utils/log')
const { readUserConfig } = require('./shared');
const { getAccessToken, verifyAccessToken } = require('./shared/access-token')

const openApiLog = Log('MyBricks: openApi授权')

const userConfig = readUserConfig();

async function main () {
  if (!userConfig?.openApi?.tokenSecretOrPrivateKey) {
    openApiLog.error('当前未配置 openApi.tokenSecretOrPrivateKey，请检查配置文件')
    return
  }

  if (!Array.isArray(userConfig?.openApi?.accessApps) || userConfig?.openApi?.accessApps.length < 1) {
    openApiLog.error('当前未配置 openApi.accessApps 或者 需要授权的应用数小于一个')
    return
  }

  let printString = '';

  const apps = userConfig?.openApi?.accessApps;
  for (let index = 0; index < apps.length; index++) {
    const app = apps[index];
    if (app.appId) {
      const token = await getAccessToken({ appId: app.appId }, userConfig?.openApi?.tokenSecretOrPrivateKey)

      printString += `应用ID：${app.appId}\n授权token：${token}
      `
    }
  }

  openApiLog.log('当前授权应用token如下：\n')
  console.log(printString)
}

main().catch(console.error)