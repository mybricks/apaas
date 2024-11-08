const childProcess = require('child_process')

const { RUNTIME_SERVER_PATH } = require('./env')

childProcess.execSync(`pm2 stop ecosystem.config.js`, {
  stdio: 'inherit',
  cwd: RUNTIME_SERVER_PATH
})