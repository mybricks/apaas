import * as fse from 'fs-extra';
import * as path from 'path'
import executor from '@mybricks/render-core/dist/lib/executor';
import { getExecEnv, MySqlCreateOption } from './exec-env'
import { Request, Response } from 'express'

import { getComponentsMap } from './get-coms'

interface FxJson {
  id: string,
  title: string,
  inputs: Array<{ id: string, title: string }>,
  outputs: Array<{ id: string, title: string }>,
}

interface ServiceJson {
  frames?: FxJson[]
}

interface ProjectToJson extends ServiceJson {
  database: MySqlCreateOption
}


function getInputParamsFromHttp({
  query,
  body
}) {
  let rtn
  if (typeof query?.params === 'string') {
    try {
      rtn = JSON.parse(query.params)
      return rtn
    } catch (error) {

    }
  }
  if (typeof body?.params === 'string') {
    try {
      rtn = JSON.parse(body.params)
      return rtn
    } catch (error) {

    }
  }

  return query?.params ?? body.params ?? query ?? body
}

/** 终止执行的Error，我们用 Error 来终止执行 */
class StopExecError extends Error {

  reponseData: any

  constructor(data) {
    super('组件终止当前服务执行')
    this.reponseData = data;
  }

  name = 'stop-exec'
}

interface execServiceToJsonOption {
  extraServices?: Record<string, any>,
  runtimeEnv: {
    serviceId: string,
    database: MySqlCreateOption,
    componentsMap: any,
    logger: any,
  },
  debugEnv?: {
    debuggerPanel: any
  },
  httpEnv: {
    query: any,
    body: any,
    req: Request
    res: Response
  }
}

export async function execServiceToJson(toJson: ServiceJson, options: execServiceToJsonOption) {
  const { serviceId, database, componentsMap, logger } = options?.runtimeEnv ?? {};
  const { query, body, req, res } = options?.httpEnv ?? {}

  const isInDebugMode = !!options?.debugEnv;
  const { debuggerPanel } = options?.debugEnv ?? {}

  if (!Array.isArray(toJson?.frames)) {
    throw new Error('toJson 格式错误，frames 必须是 array 类型')
  }

  const targetService = toJson?.frames.find(t => t.id === serviceId);

  if (!targetService) {
    throw new Error(`当前作用域没有目标服务 ${serviceId} 定义，调用服务失败`)
  }

  const params = getInputParamsFromHttp({
    query,
    body
  })

  // 准备 env 执行环境
  // @ts-ignore
  const env = await getExecEnv({ databaseOption: database });

  return new Promise((resolve, reject) => {
    const colletctoins = [];
    const debugLogs = [];
    const collect = (...args) => {
      colletctoins.push(args)
    }

    const collectDebugLogs = (...args) => {
      debugLogs.push(args)
    }

    // const handleOnFinishedHook = (error) => {
    //   if (error instanceof StopExecError && error.reponseData) {
    //     return resolve({
    //       id: 'response',
    //       value: error?.reponseData,
    //       debugLogs,
    //     })
    //   }

    //   return resolve({
    //     id: 'onError',
    //     value: error?.stack ? error.stack.toString() : String(error?.message ?? error),
    //     runtimeLogs: colletctoins,
    //     debugLogs
    //   })
    // }
    // 监听 rt.js 的报错，如果是异步引入的就会走到这
    // process.once('uncaughtException', handleOnFinishedHook);

    // 取消监听
    const quitEvents = () => {
      // process.removeListener('uncaughtException', handleOnFinishedHook)
    }

    const _resolve = (arg) => {
      quitEvents();
      resolve(arg)
    }

    try {
      executor({
        json: targetService,
        env: {
          ...env,
          services: options?.extraServices ?? {},
          collect,
          headers: req.headers,
          cookies: req.cookies,
          setCookie: (key, value, option) => {
            res.cookie(key, value, option)
          },
          hooks: {
            onFinished: (data) => {
              throw new StopExecError(data)
            }
          },
        },
        // @ts-ignore
        _context: {
          ...(isInDebugMode ? { debuggerPanel } : {})
        },
        debug: isInDebugMode,
        // @ts-ignore
        debugLogger: collectDebugLogs,
        getComDef: ({ namespace, version }) => {
          const def = componentsMap[`${namespace}@${version}`]
          return def
        },
        // getComDef: ({ namespace, version }) => {
        //   return {
        //     runtime: () => {

        //     }
        //   }
        // },
        ref: (ref) => {
          // 监听Fx输出
          targetService?.outputs.forEach(output => {
            ref.outputs(output?.id, value => {
              resolve({
                id: output.id,
                title: output.title,
                value,
                runtimeLogs: colletctoins,
                debugLogs
              })
            })
          })

          // 监听Fx输入
          const inputId = targetService?.inputs?.[0]?.id;
          ref.inputs[inputId]?.(params)
        },
        onError: (err) => {
          logger.error({ serviceId, error: err?.stack ? err.stack.toString() : String(err?.message ?? err) }, '执行逻辑出错')
          _resolve({
            id: 'onError',
            value: err?.stack ? err.stack.toString() : String(err?.message ?? err),
            runtimeLogs: colletctoins,
            debugLogs,
          })
        }
      })
    } catch (error) {
      // env.hooks.onFinished 被调用，以后 runtime 的引用方式变了的话可能会走这里
      if (error instanceof StopExecError && error.reponseData) {
        return _resolve({
          id: 'response',
          value: error.reponseData,
          runtimeLogs: colletctoins,
          debugLogs,
        })
      }

      logger.error({ serviceId, error: error?.stack ? error.stack.toString() : (error?.message ?? '未知错误，执行 executor 出错') }, '执行 executor 出错')
      _resolve({
        id: 'onError',
        value: error?.stack ? error.stack.toString() : (error?.message ?? '未知错误，执行 executor 出错'),
        runtimeLogs: colletctoins,
        debugLogs,
      })
    }
  })
}


export async function getProject (folderPath, folderName) {
  const projectFolderPath = path.join(folderPath, folderName);

  const frontEndFolderPath = path.resolve(projectFolderPath, 'front_end');
  const backEndFolderPath = path.resolve(projectFolderPath, 'back_end');

  return {
    projectFolderPath,
    frontEndFolderPath,
    backEndFolderPath,
  }
}


export async function getServiceProject(scopeId, scopePath) {
  const { backEndFolderPath } = await getProject(scopePath, scopeId);

  const projectToJsonPath = path.resolve(backEndFolderPath, 'project.json');
  
  const comlibsJsPath = path.resolve(backEndFolderPath, 'comlibs.js');

  if (!await fse.pathExists(backEndFolderPath) || !await fse.pathExists(projectToJsonPath)) {
    throw new Error(`当前 scopeId: ${scopeId} 产物缺失，已失效`)
  }

  const projectToJson: ProjectToJson = await fse.readJSON(projectToJsonPath);

  let scriptContent = '';
  try {
    scriptContent = await fse.readFile(comlibsJsPath, 'utf-8')
  } catch (error) {}
  let componentsMap = await getComponentsMap(scriptContent);

  return {
    projectToJson,
    componentsMap,
  }
}