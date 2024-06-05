import * as fse from 'fs-extra'
import { Logger } from '@mybricks/rocker-commons';
import * as childProcess from 'child_process';
const path = require('path')
const parse5 = require('parse5');

const MysqlExecutor = require('./../../../../../scripts/shared/mysql-executor.js')

const userConfig = require('./../../../../../scripts/shared/read-user-config.js')();

const mysqlExecutor = MysqlExecutor()

import { injectAjaxScript, travelDom, injectAppConfigScript } from './util'


/** 从文件夹安装 */
export async function installAppFromFolder(installAppFolderDir, destAppDir, { namespace }, { logPrefix }) {
  if (!await fse.pathExists(installAppFolderDir)) {
    throw new Error(`应用包路径 ${installAppFolderDir} 不存在`)
  }

  Logger.info(`${logPrefix} 开始安装 `)

  let pkg = require(path.join(installAppFolderDir, './package.json'));
  let bePath = path.join(installAppFolderDir, './nodejs');
  let fePath = path.join(installAppFolderDir, './assets');
  let preInstallPath = path.join(installAppFolderDir, './preinstall.js');

  if (fse.existsSync(fePath)) { // 存在前端
    Logger.info(`${logPrefix} 前端资源处理中 `)
    if (pkg?.mybricks?.type !== 'system') { // 非系统任务
      const feDirs = fse.readdirSync(fePath)
      feDirs?.forEach(name => {
        if (name.indexOf('.html') !== -1 && name !== 'preview.html' && name !== 'publish.html') {
          // 默认注入所有的资源
          const srcHomePage = path.join(fePath, name)
          const rawHomePageStr = fse.readFileSync(srcHomePage, 'utf-8')
          let handledHomePageDom = parse5.parse(rawHomePageStr);
          travelDom(handledHomePageDom, {
            ajaxScriptStr: injectAjaxScript({
              namespace: pkg.name ? pkg.name : ''
            }),
            appConfigScriptStr: injectAppConfigScript({
              namespace: pkg.name ? pkg.name : '',
              version: pkg?.version,
              ...(pkg?.mybricks || {})
            }),
            rawHtmlStr: rawHomePageStr,
          })
          let handledHomePageStr = parse5.serialize(handledHomePageDom)
          fse.writeFileSync(srcHomePage, handledHomePageStr, 'utf-8')
        }
      })
    }
  }

  if (fse.existsSync(preInstallPath)) { // 存在 preInstall
    Logger.info(`${logPrefix} preInstall 逻辑处理中 `)
    await mysqlExecutor.connectInDatabase()
    await execJs({
      execSqlAsync: mysqlExecutor.execSqlAsync,
      jsPath: preInstallPath
    })
    await mysqlExecutor.closeConnection()
  }

  Logger.info(`${logPrefix} 资源复制中 `)
  await copyFiles(['assets', 'nodejs', 'package.json', 'preinstall.js', 'tsconfig.json', '.gitignore', 'README.md'], installAppFolderDir, destAppDir)
}


async function execJs({ jsPath, execSqlAsync }) {
  const loadScript = require(jsPath)
  await loadScript({
    execSql: execSqlAsync
  })
}


export const installAppDeps = async (sourceDir: string, appDir: string, forceInstall = false) => {
  if (await fse.pathExists(path.join(sourceDir, 'node_modules'))) {
    Logger.info(`[install node_modules]: 检测到安装包包含 node_modules，开始复制 node_modules`)
    await copyFiles(['node_modules'], sourceDir, appDir);
    Logger.info(`[install node_modules]: 复制 node_modules 成功`)
    return
  }

  if (!await fse.pathExists(appDir)) {
    throw new Error(`App ${appDir} not exist.`)
  }

  Logger.info(`[install node_modules]: 正在检测 ${appDir} 的node_modules，请稍后`)


  let packageJson: any = {};
  let depDir = null;
  let serverPath = null;

  try {
    packageJson = await fse.readJSON(path.join(appDir, 'package.json'));
    depDir = path.join(appDir, 'node_modules');
    serverPath = path.join(appDir, 'nodejs');
  } catch (error) {
    
  }

  // 非强制安装时，判断node_modules有就不安装了
  let shouldInstall = forceInstall ? true : !fse.existsSync(depDir);

  let logStr

  if (shouldInstall && (await fse.pathExists(serverPath)) && packageJson.dependencies) {
    const installCommand = userConfig?.platformConfig?.installCommand ?? `npm i --registry=https://registry.npmmirror.com --production`;
    Logger.info(`[install node_modules]: 开始安装 ${packageJson.name} 应用依赖，执行命令${installCommand}，请稍后`)

    // 目前安装失败时跳过安装吧，重启的时候可以通过检测检测出来
    try {
      logStr = childProcess.execSync(installCommand, { cwd: appDir })
      if (logStr.indexOf('npm ERR') !== -1) {
        throw new Error(logStr)
      }
    } catch (error) {
      Logger.error(`[install node_modules]: ${packageJson.name} 依赖安装失败，错误详情 ${error.stack}`)
      Logger.error(`[install node_modules]: ${packageJson.name} 依赖安装失败，已跳过，可以后续重新安装并重启服务器`)
    }
  } else {
    Logger.info(`[install node_modules]: 检测到 ${packageJson.name} 依赖已安装，跳过依赖安装`)
  }
}

/**
 * 拷贝文件列表从来源文件夹到目标文件夹
 * @param {string[]} fileList - 文件列表
 * @param {string} sourceDir - 来源文件夹
 * @param {string} targetDir - 目标文件夹
 */
async function copyFiles(fileList, sourceDir, targetDir) {
  // 确保目标文件夹存在，如果不存在则创建
  await fse.ensureDir(targetDir);

  // 遍历文件列表并拷贝每个文件
  for (const file of fileList) {
    const sourceFile = path.join(sourceDir, file);
    const targetFile = path.join(targetDir, file);

    // 删除历史文件
    if (fse.existsSync(targetFile)) {
      await fse.remove(targetFile)
    }

    if (!fse.existsSync(sourceFile)) {
      continue
    }

    // 拷贝文件
    await fse.copy(sourceFile, targetFile, { overwrite: true });
  }
}