import * as path from 'path'
const { APPS_FOLDER } = require('./../../env.js')

/** 支持挂载的运行时根目录，包含各类动态数据，比如安装的应用、日志、静态资源以及运行时实现的文件系统 */ 
const FILE_LOCAL_STORAGE_BASE_FOLDER = process.env.EXTERNAL_FILE_STORAGE ? process.env.EXTERNAL_FILE_STORAGE : path.resolve(__dirname, './../../../../');

/** 日志根目录 */ 
const LOGS_BASE_FOLDER = path.join(FILE_LOCAL_STORAGE_BASE_FOLDER, './logs');

/** 应用根目录 */ 
const APPS_BASE_FOLDER = APPS_FOLDER;

/** 运行时文件系统的根目录 */ 
const FILE_LOCAL_STORAGE_FOLDER = path.join(FILE_LOCAL_STORAGE_BASE_FOLDER, './_localstorage');

/** 性能分析目录 */
const FILE_ANALYSIS_PERFORMANCE_FOLDER = path.join(FILE_LOCAL_STORAGE_FOLDER, './__analyse__/performance')

/** 平台的静态资源 */
const PLATFORM_ASSETS_FOLDER = path.join(__dirname, './../../../fe/assets');

/** 制品库前缀 */
const FILE_APP_PRODUCTS_FOLDER_PREFIX = '__app_products__'
/** 制品库存储位置 */
const FILE_APP_PRODUCTS_FOLDER = path.join(FILE_LOCAL_STORAGE_FOLDER, `./${FILE_APP_PRODUCTS_FOLDER_PREFIX}`)

const FILE_LOCAL_STORAGE_PREFIX = 'mfs'
const FILE_LOCAL_STORAGE_PREFIX_RUNTIME = 'runtime/mfs'


/** 安装 / 更新 应用的锁 */
const FILE_UPGRADE_LOCK_FILE = path.join(FILE_LOCAL_STORAGE_FOLDER, '_lock_.lock')

export default {
  isDev() {
    return process.env.NODE_ENV === "development";
  },
  isStaging() {
    return process.env.NODE_ENV === "staging";
  },
  isProd() {
    return process.env.NODE_ENV === "production";
  },
  getAppInstallFolder() {
    return APPS_BASE_FOLDER
  },

  NPM_REGISTRY: 'https://registry.npmmirror.com',

  LOGS_BASE_FOLDER,

  FILE_ANALYSIS_PERFORMANCE_FOLDER,

  PLATFORM_ASSETS_FOLDER,
  FILE_LOCAL_STORAGE_FOLDER,
  FILE_LOCAL_STORAGE_PREFIX,
  FILE_APP_PRODUCTS_FOLDER_PREFIX,
  FILE_APP_PRODUCTS_FOLDER,

  FILE_UPGRADE_LOCK_FILE
};
