const path = require('path')
const userConfig = require('./shared/read-user-config')()

// TODO：兼容下文档错误
const externalStoragePath = userConfig?.platformConfig?.externalFilesStoragePath ?? userConfig?.platformConfig?.exteralFilesStoragePath;

/** 支持挂载的运行时根目录，包含各类动态数据，比如安装的应用、日志、静态资源以及运行时实现的文件系统 */ 
const FILE_LOCAL_STORAGE_BASE_FOLDER = externalStoragePath ? externalStoragePath : path.resolve(__dirname, './../');

/** 开发应用目录 */ 
const APPS_DEV_FOLDER = path.join(__dirname, './../apps');

/** 运行时应用目录 */ 
const APPS_FOLDER = path.join(FILE_LOCAL_STORAGE_BASE_FOLDER, './_apps');

/** 运行时文件系统的根目录 */ 
const FILE_LOCAL_STORAGE_FOLDER = path.join(FILE_LOCAL_STORAGE_BASE_FOLDER, './_localstorage');

/** 平台前端目录 */
const PLATFORM_FE_PATH = path.join(__dirname, './../platform/fe');

/** 平台后端目录 */
const PLATFORM_SERVER_PATH = path.join(__dirname, './../platform/server');

/** SQL文件存放目录 */
const SQL_PATH = path.join(__dirname, './../platform/server/sql');


module.exports = {
  PLATFORM_FE_PATH,
  PLATFORM_SERVER_PATH,
  FILE_LOCAL_STORAGE_BASE_FOLDER,
  FILE_LOCAL_STORAGE_FOLDER,
  APPS_FOLDER,
  APPS_DEV_FOLDER,
  SQL_PATH,
}