const fse = require('fs-extra')
const path = require('path')
const { PLATFORM_SERVER_PATH } = require('./../env')

function readPackageJson () {
  return fse.readJsonSync(path.join(PLATFORM_SERVER_PATH, 'package.json'), 'utf-8')
}

module.exports = readPackageJson
