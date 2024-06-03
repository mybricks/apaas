const fse = require('fs-extra')
const path = require('path')
const childProcess = require('child_process')

const { PLATFORM_SERVER_PATH } = require('./env')

childProcess.execSync(`npm run reload:prod`, {
  stdio: 'inherit',
  cwd: PLATFORM_SERVER_PATH
})