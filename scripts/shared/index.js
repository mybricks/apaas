/**
 * @description shared 文件后续可以抽成通用的方法，主要目的是平台前后端、脚本共用的代码
 */


const readUserConfig = require('./read-user-config');
const loadApps = require('./load-apps');
const MySqlExecutor = require('./mysql-executor');

function isYarnExist() {
  return false
  let result;
  try{
    cp.execSync('which yarn').toString()
    result = true
  } catch(e) {
    result = false
  }
  return result
}

module.exports = {
  MySqlExecutor,
  isYarnExist,
  readUserConfig,
  loadApps
}