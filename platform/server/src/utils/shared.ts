const { readUserConfig, loadApps: _loadApps, MySqlExecutor: _MySqlExecutor, accessToken: _accessToken } = require('./../../../../scripts/shared/index.js')


/**
 * @description 缓存函数
 * @param fn 
 * @returns 
 */
function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache: { [key: string]: ReturnType<T> } = {};
  const memoizedFn = (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);

    if (cache[key] !== undefined) {
      return cache[key];
    }

    const result = fn(...args);
    cache[key] = result;

    return result;
  };

  return memoizedFn as T;
}


interface Configuration {
  /** 数据库配置 */
  database: {
    dbType: 'MYSQL'
    host: string
    user: string
    password: string
    port: number
    database: string
  }
  platformConfig: {
    port: number
    appName: string

    title?: string
    logo?: string
    favicon?: string

    openLogout?: boolean
    createBasedOnTemplate?: string[]
    openUserInfoSetting?: boolean

    jwtSecretOrPrivateKey?: string

    openMonitor?: boolean
    gzip?: boolean

    installCommand?: string
  }

  oss?: any

  openApi?: {
    tokenSecretOrPrivateKey?: string
  }

}

interface LoadedApp {
  namespace: string,
  name: string,

  mapperFolderDirectory?: string
}


/**
 * @description 已缓存的平台配置
 */
export const configuration: Configuration = memoize(readUserConfig)();

/**
 * @description 已缓存的加载App
 */
export const loadedApps: LoadedApp[] = memoize(_loadApps)();


export const loadApps = _loadApps

/**
 * @description Sql执行器
 */
export const MySqlExecutor = _MySqlExecutor


export const accessToken = _accessToken