const userConfig = require('./../../scripts/shared/read-user-config.js')();

module.exports = {
  apps: [
    {
      name: userConfig?.platformConfig?.appName,
      script: "./index.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        "MYBRICKS_NODE_MODE": "slave",
        "MYBRICKS_RUN_MODE": "ecs",
        "TZ": "Asia/Shanghai"
      }
    }
  ]
}