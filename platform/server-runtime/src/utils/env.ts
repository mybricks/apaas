import * as path from 'path'
const configuration = require('./../../scripts/shared/read-config')

/** 日志根目录 */ 
const LOGS_BASE_FOLDER = path.join(configuration.FILE_LOCAL_STORAGE_BASE_FOLDER, 'logs', 'application-runtime');

/** 前后端一体化项目基础目录 */
const APP_PROJECT_BASE_PATH = path.join(configuration.FILE_LOCAL_STORAGE_FOLDER, '__app_projects__');

/** 一体化项目生产环境目录 */
const APP_PROJECT_PROD_PATH = path.join(APP_PROJECT_BASE_PATH, 'prod');

/** 一体化项目预发环境目录 */
const APP_PROJECT_STAGING_PATH = path.join(APP_PROJECT_BASE_PATH, 'staging');

/** 服体化项目调试环境目录 */
const APP_PROJECT_DEBUG_PATH = path.join(APP_PROJECT_BASE_PATH, 'debug');


export default {
  APP_PROJECT_BASE_PATH,
  LOGS_BASE_FOLDER,
  FILE_LOCAL_STORAGE_FOLDER: configuration.FILE_LOCAL_STORAGE_FOLDER,
  APP_PROJECT_PROD_PATH,
  APP_PROJECT_STAGING_PATH,
  APP_PROJECT_DEBUG_PATH
}