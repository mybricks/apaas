const path = require('path')

/** 应用目录 */ 
const APPS_FOLDER = path.join(__dirname, './../apps');

/** 平台前端目录 */
const PLATFORM_FE_PATH = path.join(__dirname, './../platform/fe');

/** 平台后端目录 */
const PLATFORM_SERVER_PATH = path.join(__dirname, './../platform/server');

/** SQL文件存放目录 */
const SQL_PATH = path.join(__dirname, './../platform/server/sql');


module.exports = {
  PLATFORM_FE_PATH,
  PLATFORM_SERVER_PATH,
  APPS_FOLDER,
  SQL_PATH,
}