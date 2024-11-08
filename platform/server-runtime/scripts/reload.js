const childProcess = require('child_process')

const { RUNTIME_SERVER_PATH } = require('./env')

childProcess.execSync(`NODE_ENV=production pm2 reload ecosystem.config.js`, {
  stdio: 'inherit',
  cwd: RUNTIME_SERVER_PATH
})