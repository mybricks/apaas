const fse = require('fs-extra')
const path = require('path')
const childProcess = require('child_process')

const { PLATFORM_FE_PATH } = require('./env')

childProcess.execSync(`npm run dev`, {
  stdio: 'inherit',
  cwd: PLATFORM_FE_PATH
})