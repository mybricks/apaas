import { Module, OnModuleInit } from "@nestjs/common";
import { DiscoveryService, Reflector } from "@nestjs/core";
import * as path from 'path';

import AppController from "./app.controller";

import HttpProxyService from './services/proxy';
import HomeService from './services/home'

import FlowModule from './module/flow/flow.module'
import SystemModule from './module/system/system.module'
import FileModule from './module/file/file.module'
import ShareModule from "./module/share/share.module";
import UserModule from "./module/user/user.module";
import UserFileModule from "./module/userFile/userFile.module";
import UserGroupModule from "./module/userGroup/userGroup.module";
import AppsModule from "./module/apps/apps.module";
import OssModule from './module/oss/oss.module'
import LogModule from './module/log/log.module'
import ConfigModule from "./module/config/config.module";
import OpenApiModule from "./module/open-api/open-api.module";

import LoginModule from './module/login/login.module'

import AnalyseModule from './module/analyse/analyse.module'

import { loadInstalledAppModules } from './mount-installed-apps'

@Module({
  imports: [
    LoginModule, // 登录模块，登录相关的功能
    FileModule,
    ShareModule, // 分享模块，分享相关功能
    UserModule,
    UserFileModule, 
    UserGroupModule, // 协作组模块
    AppsModule, // 应用管理模块，仅保留 获取已安装的应用 / 离线安装应用功能
    FlowModule, // 静态文件管理模块，运行时静态文件的管理，包含 各类静态资源 和 制品库 的增删查改 功能
    OssModule,
    ConfigModule,
    SystemModule, // 系统模块，仅保留了上报埋点 / 重启应用 / 诊断服务 等功能
    LogModule, // 日志模块，仅保留运行时日志，性能日志、操作日志（比如应用保存时的diff日志）等功能
    OpenApiModule,
    AnalyseModule,
    // 加载已安装的 APP
    ...(loadInstalledAppModules()),
  ],
  controllers: [
    AppController, // workspace相关
    HttpProxyService, // 接口代理
    HomeService, // 平台根路径，主要用于跳转登录页
  ],
  providers: [
    DiscoveryService
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private reflector: Reflector, private readonly discoveryService: DiscoveryService) {}

  // 1. 统计重复路由
  // 2. 支持应用间直接调用，而不是Http通信
  onModuleInit() {
    try {
      const MethodMap = {
        0: 'GET',
        1: 'POST',
        2: 'PUT',
        3: 'DELETE',
      };
      const controllerInstances = this.discoveryService.getControllers();
      const controllerInstanceMap = controllerInstances.reduce((per, instance) => {
        return { ...per, [instance.name]: instance };
      }, {});
      const pathMap = {};
      const repeatPathMap = {};
      controllerInstances.forEach(instance => {
        const prefix = this.reflector.get('path', instance.instance.constructor);
        Object.getOwnPropertyNames(instance.instance.__proto__)
          .filter(key => key !== 'constructor')
          .forEach(key => {
            const routerPath = this.reflector.get('path', instance.instance[key]);
            const methodCode = this.reflector.get('method', instance.instance[key]);

            if (routerPath === undefined || methodCode === undefined) {
              return;
            }

            let curPath = path.join(prefix, routerPath);
            if (!curPath.startsWith('/')) {
              curPath = '/' + curPath;
            }
            if (curPath.endsWith('/')) {
              curPath = curPath.slice(0, -1);
            }
            curPath += `[${MethodMap[methodCode]}]`;
            /** 兼容 windows */
            curPath = curPath.replace(/\\/g, '/').replace(/^\/\//, '/');


            const curMap = { controller: instance.name, handler: key };

            /** 统计重复路由 */
            if (pathMap[curPath]) {
              if (!Array.isArray(repeatPathMap[curPath])) {
                repeatPathMap[curPath] = [pathMap[curPath], curMap];
              } else {
                repeatPathMap[curPath] = [...repeatPathMap[curPath], curMap];
              }
            }

            pathMap[curPath] = curMap;
          })
      });

      /** 重复路由 */
      if (Object.keys(repeatPathMap).length) {
        Object.keys(repeatPathMap).forEach(key => {
          const [_, path, method] = key.match(/^([^\[]*)\[(.*)]$/);

          if(!global.MYBRICKS_PLATFORM_START_ERROR) {
            global.MYBRICKS_PLATFORM_START_ERROR = ''
          } else {
            global.MYBRICKS_PLATFORM_START_ERROR += '\n';
          }
          global.MYBRICKS_PLATFORM_START_ERROR += `路由重复错误：请求方法为 ${method} 且路径为 ${path} 的路由存在重复，分别来自 Controller 中 ${repeatPathMap[key].map(item => `${item.controller} 的 ${item.handler} 方法`).join('、')}`;
        });
      }

      global.emitGlobalEvent = async (path: string, method: string, ...args: any[]) => {
        const curHandler = pathMap[`${path}[${method}]`];

        return await controllerInstanceMap[curHandler.controller].instance[curHandler.handler](...args);
      };
    } catch (e) {
      console.log('获取服务所有 controller 失败：', e);
    }
    // 使用方式：global.emitGlobalEvent('/paas/api/flow/getAsset', 'GET', {}).then(res => console.log(res.data));
  }
}