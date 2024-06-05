import * as path from "path";
import { NextFunction, Request, Response } from "express";
import { Logger } from "@mybricks/rocker-commons";

import env from "./utils/env";

const loadApps = require('./../../../scripts/shared/load-apps.js')

/** 将APP内静态资源挂载上来 */
export function installedAppMount(app: any, namespaces: string[]) {
  namespaces?.forEach(ns => {
    const baseFolder = env.getAppInstallFolder()
    // ns切割
    app.useStaticAssets(path.join(baseFolder, ns?.indexOf('/') > -1 ? `/${encodeURIComponent(ns)}/assets/` : `/${ns}/assets/`), {
      prefix: `/${ns}`,
      index: false,
      setHeaders: (res, path, stat) => {
        if (path?.indexOf('.html') === -1) {
          res.set('Cache-Control', 'no-cache') // 1d
        }
        res.set('Access-Control-Allow-Origin', '*');
      },
      etag: true,
      lastModified: true,
    });
 
    // 静态资源hash规范，也支持直接访问
    app.useStaticAssets(path.join(baseFolder, `/${ns}/assets/`), {
      prefix: `/`,
      index: false,
      setHeaders: (res, path, stat) => {
        res.set('Access-Control-Allow-Origin', '*');
        if (path?.indexOf('.html') === -1) {
          res.set('Cache-Control', 'no-cache') // 1d
        }
      },
      etag: true,
      lastModified: true,
    });
  })
}

const PAAS_PREFIX = [
  "/api/apps/",
  "/api/config/",
  "/api/file/",
  "/api/ground/",
  "/api/product/",
  "/api/system/",
  "/api/task/",
  "/api/user/",
  "/api/workspace/",
];

/** 将APP内相对路由转到平台上来 */
const routerRedirectMiddleWare = (namespaceMap) => {

  const appRegs = [];
  const paasRegs = [];
  const prefixList = Object.keys(namespaceMap)
  prefixList?.forEach((prefix) => {
    appRegs.push({
      reg: new RegExp(`^/${prefix}/`),
      namespace: prefix
    });
  });
  PAAS_PREFIX?.forEach((prefix) => {
    paasRegs.push(new RegExp(`^${prefix}`));
  });
  return (req: Request, res: Response, next: NextFunction) => {
    let handleUrl = req.url;
    let jumpPaas = false;
    let customPrefixList = Object.keys(global.MYBRICKS_MODULE_CUSTOM_PATH || {})
    let jumpCustomController = false
    customPrefixList?.forEach((prefix) => {
      if(req?.path?.startsWith(prefix)) {
        jumpCustomController = true
        return
      }
    })
    if(jumpCustomController) {
      console.log('自定义业务接口，跳过', req?.path)
      next()
      return
    }
    appRegs.forEach(({reg, namespace}) => {
      if (reg.test(handleUrl)) {
        jumpPaas = true;
        if(namespaceMap?.[namespace]?.hasServer) {
          let isPaaSInterface = false
          PAAS_PREFIX.forEach(i => {
            if(handleUrl.indexOf(i) !== -1) {
              isPaaSInterface = true
            }
          })
          if(isPaaSInterface) {
            if(handleUrl.indexOf('/paas/') !== -1) {
              handleUrl = handleUrl.replace(reg, "/");
            } else {
              handleUrl = handleUrl.replace(reg, "/paas/");
            }
          } else {
            handleUrl = handleUrl.replace(reg, "/");
          }
        } else {
          if(handleUrl.indexOf('/paas/') !== -1) {
            handleUrl = handleUrl.replace(reg, "/");
          } else {
            handleUrl = handleUrl.replace(reg, "/paas/");
          }
        }
      }
    });
    if (!jumpPaas) {
      paasRegs.forEach((reg, index) => {
        const restPart = PAAS_PREFIX[index].split("/api/")?.[1];
        if (restPart) {
          handleUrl = handleUrl.replace(reg, `/paas/api/${restPart}`);
        }
      });
    }
    req.url = handleUrl;
    next();
  };
};

/** 将APP内相对路由转到平台上来 */
export function installedAppRouterMount(app: any, loadedApps: any) {

  const namespaceMap = {}
  loadedApps.forEach(a => {
    namespaceMap[a.namespace] = {
      hasServer: a.hasServer
    }
  })

  app.use(routerRedirectMiddleWare(namespaceMap))
}


export function loadInstalledAppMeta() {
  return loadApps();
}

export function loadInstalledAppModules() {
  let modules = [];
  loadApps(({ serverModuleDirectory, hasServer }, appName) => {
    if (hasServer) {
      try {
        modules.push(require(serverModuleDirectory).default);
      } catch (e) {
        if(!global.MYBRICKS_PLATFORM_START_ERROR) {
          global.MYBRICKS_PLATFORM_START_ERROR = ''
        }
        global.MYBRICKS_PLATFORM_START_ERROR += `\n 模块 ${appName} 加载失败 \n ${e.message.indexOf('Cannot find module') > -1 ? '可能是node_modules安装失败，建议重新/手动安装node_modules' : ''} \n 错误是：${e.message} \n 详情是: ${e?.stack?.toString()}`;
        Logger.info(`模块加载失败, 准备跳过：${e.message}`)
        Logger.info(`错误详情是: ${e?.stack?.toString()}`)
      }
    }
    return {}
  })
  return modules
}