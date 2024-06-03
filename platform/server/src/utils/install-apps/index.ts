import * as fse from 'fs-extra'
import { Logger } from '@mybricks/rocker-commons';

const path = require('path')
const parse5 = require('parse5');

const MysqlExecutor = require('./../../../../../scripts/shared/mysql-executor.js')

const mysqlExecutor = MysqlExecutor()

import { injectAjaxScript, travelDom, injectAppConfigScript } from './util'


/** 从文件夹安装 */
export async function installAppFromFolder(installAppFolderDir, destAppDir, { namespace }) {
  if (!await fse.pathExists(installAppFolderDir)) {
    throw new Error(`应用包路径 ${installAppFolderDir} 不存在`)
  }

  Logger.info(`【install】: 应用 ${namespace} 开始安装 `)

  let pkg = require(path.join(installAppFolderDir, './package.json'));
  let bePath = path.join(installAppFolderDir, './nodejs');
  let fePath = path.join(installAppFolderDir, './assets');
  let preInstallPath = path.join(installAppFolderDir, './preinstall.js');

  if (fse.existsSync(fePath)) { // 存在前端
    Logger.info(`【install】: 应用 ${namespace} 前端资源处理中 `)
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
    Logger.info(`【install】: 应用 ${namespace} preInstall 逻辑处理中 `)
    await mysqlExecutor.connectInDatabase()
    await execJs({
      execSqlAsync: mysqlExecutor.execSqlAsync,
      jsPath: preInstallPath
    })
    await mysqlExecutor.closeConnection()
  }

  Logger.info(`【install】: 应用 ${namespace} 资源复制中 `)
  await copyFiles(['assets', 'nodejs', 'package.json', 'preinstall.js', 'tsconfig.json', '.gitignore', 'README.md'], installAppFolderDir, destAppDir)
}


async function execJs({ jsPath, execSqlAsync }) {
  const loadScript = require(jsPath)
  await loadScript({
    execSql: execSqlAsync
  })
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