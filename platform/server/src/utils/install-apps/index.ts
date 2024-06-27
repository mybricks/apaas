import * as fse from 'fs-extra'
import { Logger } from '@mybricks/rocker-commons';
import * as childProcess from 'child_process';

import { configuration, MySqlExecutor } from './../../utils/shared';

const path = require('path')
const parse5 = require('parse5');

const mysqlExecutor = MySqlExecutor()

import { injectAjaxScript, travelDom, injectAppConfigScript } from './util'

/**
 * @description 从文件夹安装
 * @param {string} installAppFolderDir 安装目录
 * @param {string} destAppDir 目标目录
 * @param {Object} options - 配置项.
 * @param {string} options.namespace - 应用namspace
 * @param {boolean} options.autoInstallNodeModules - 如果安装目录没有node_modules，则自动安装node_modules
 */
export async function installAppFromFolder(installAppFolderDir, destAppDir, { namespace, autoInstallNodeModules }, { logPrefix }) {
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

  Logger.info(`${logPrefix} 资源复制中`)
  await copyFiles(['assets', 'nodejs', 'package.json', 'preinstall.js', 'tsconfig.json', '.gitignore', 'README.md'], installAppFolderDir, destAppDir)

  if (await fse.pathExists(path.join(installAppFolderDir, 'node_modules'))) {
    Logger.info(`${logPrefix} 检测到安装包包含 node_modules，开始移动 node_modules`);
    const startMoveTime = Date.now()
    await moveNodeModules(installAppFolderDir, destAppDir);
    Logger.info(`${logPrefix} 移动node_modules成功，总计耗时 ${Date.now() - startMoveTime}ms`)
    return
  }

  await installAppDeps(installAppFolderDir, autoInstallNodeModules, { logPrefix });

  if (await fse.pathExists(path.join(installAppFolderDir, 'node_modules'))) {
    Logger.info(`${logPrefix} 检测到安装包包含 node_modules，开始移动 node_modules`);
    const startMoveTime = Date.now()
    await moveNodeModules(installAppFolderDir, destAppDir);
    Logger.info(`${logPrefix} 移动node_modules成功，总计耗时 ${Date.now() - startMoveTime}ms`)
    return
  }
}


async function execJs({ jsPath, execSqlAsync }) {
  const loadScript = require(jsPath)
  await loadScript({
    execSql: execSqlAsync
  })
}

async function installAppDeps (appDir: string, autoInstallNodeModules = false, { logPrefix }) {
  if (!await fse.pathExists(appDir)) {
    throw new Error(`App ${appDir} not exist.`)
  }

  Logger.info(`${logPrefix} 正在检测 ${appDir} 的node_modules，请稍后`)

  let packageJson: any = {};
  let depDir = null;
  let serverPath = null;

  try {
    packageJson = await fse.readJSON(path.join(appDir, 'package.json'));
    depDir = path.join(appDir, 'node_modules');
    serverPath = path.join(appDir, 'nodejs');
  } catch (error) {
    
  }

  // 当没有node_modules依赖，且启用了自动安装才安装
  let shouldInstall = autoInstallNodeModules && !fse.existsSync(depDir);

  let logStr

  if (shouldInstall && (await fse.pathExists(serverPath)) && packageJson.dependencies) {
    const installCommand = configuration?.platformConfig?.installCommand ?? `npm i --registry=https://registry.npmmirror.com --production`;
    Logger.info(`${logPrefix} 开始安装 ${packageJson.name} 应用依赖，执行命令${installCommand}，请稍后`)

    // 目前安装失败时跳过安装吧，重启的时候可以通过检测检测出来
    try {
      logStr = childProcess.execSync(installCommand, { cwd: appDir })
      if (logStr.indexOf('npm ERR') !== -1) {
        throw new Error(logStr)
      }
    } catch (error) {
      Logger.error(`${logPrefix} ${packageJson.name} 依赖安装失败，错误详情 ${error.stack}`)
      Logger.error(`${logPrefix} ${packageJson.name} 依赖安装失败，已跳过，可以后续重新安装并重启服务器`)
    }
    Logger.info(`${logPrefix} 安装 ${packageJson.name} 应用依赖成功`)
  } else {
    Logger.info(`${logPrefix} 检测到本次安装无需安装依赖，跳过依赖安装`)
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

    if (!fse.existsSync(sourceFile)) {
      continue
    }

    // 删除历史文件
    if (fse.existsSync(targetFile)) {
      await fse.remove(targetFile)
    }

    // 拷贝文件
    await fse.copy(sourceFile, targetFile, { overwrite: true });
  }
}

async function moveNodeModules (sourceDir, targetDir) {
  const sourceFolderPath = path.join(sourceDir, 'node_modules');
  const targetFolderPath = path.join(targetDir, 'node_modules')

  // 注意，这里node_modules处理一定用move方法，否则性能差到十几分钟往上
  await fse.move(sourceFolderPath, targetFolderPath, { overwrite: true })
}