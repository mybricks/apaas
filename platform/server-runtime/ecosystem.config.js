const config = require('./scripts/shared/read-config');

module.exports = {
  apps: [
    {
      name: config?.appName,
      script: "./index.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {}
    }
  ]
}