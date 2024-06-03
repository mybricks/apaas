const userConfig = require('./../../scripts/shared/read-user-config.js')();
const path = require('path')

module.exports = {
  apps: [
    {
      name: userConfig?.platformConfig?.appName ?? "index",
      script: "./index.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        "MYBRICKS_PLATFORM_PORT": userConfig?.platformConfig?.port,
        "MYBRICKS_NODE_MODE": "slave",
        "MYBRICKS_RUN_MODE": "ecs",
        "TZ": "Asia/Shanghai",
        "EXTERNAL_FILE_STORAGE": userConfig?.platformConfig?.externalFiles?.basePath ? path.join(__dirname, "./../../", userConfig?.platformConfig?.externalFiles?.basePath) : undefined,
      }
    }
  ]
}