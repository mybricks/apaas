const fse = require('fs-extra')
const path = require('path')
const { APPS_FOLDER, APPS_DEV_FOLDER } = require('./../env')

function isObject (obj) { return Object.prototype.toString.call(obj) === '[object Object]' } 

/** 深度遍历查找是否有页面声明 */
const findPageFiles = (folderDir) => {
  let result = [];
  const files = fse.readdirSync(folderDir);
  for (const file of files) {
    const filePath = `${folderDir}/${file}`;
    const stats = fse.statSync(filePath);
    if (stats.isDirectory()) {
      const subResult = findPageFiles(filePath);
      result = [...result, ...subResult];
    } else if (/\.page\.tsx$/.test(file)) {
      const fileName = file.replace(/\.page\.tsx$/, '');
      result.push({
        name: fileName,
        directory: filePath,
      });
    }
  }
  return result
}

/** 扫描app文件夹 */
const scanAppDir = (dirFullPath, appName, callback) => {
  let directory = dirFullPath;
  let publicFolderPath = path.join(dirFullPath, 'public'); // 约定
  let assetsFolderPath = path.join(dirFullPath, 'assets'); // 约定
  let pageRecord = {};

  const packageJsonPath = path.join(dirFullPath, 'package.json'); // 约定

  if (!fse.existsSync(packageJsonPath)) {
    return
  }

  const packageJson = fse.readJsonSync(packageJsonPath, 'utf-8');

  // 规范一：按pages文件夹的规范来找
  const pagesFolderPath = path.join(dirFullPath, 'pages'); // 约定
  if (fse.existsSync(pagesFolderPath)) {

    const pages = fse.readdirSync(pagesFolderPath);
    if (pages) {
      pages.forEach(page => {
        // pages下每一个文件夹需要有一个index.tsx文件作为入口
        if (fse.statSync(path.join(pagesFolderPath, page)).isDirectory && fse.existsSync(path.join(pagesFolderPath, page, 'index.tsx')) && fse.existsSync(path.join(publicFolderPath, `${page}.html`))) { // 约定
          pageRecord[page] = {
            entry: path.join(pagesFolderPath, page, 'index.tsx'),
            template: path.join(publicFolderPath, `${page}.html`),
          }
        }
      })
    }
  }

  // 规范二：按fe文件夹的规范来找
  const feFolderPath = path.join(dirFullPath, 'fe'); // 约定
  if (fse.existsSync(feFolderPath)) {

    publicFolderPath = path.join(feFolderPath, 'public'); // 约定
    const sourceCodeDirectory = path.join(feFolderPath, 'src'); // 约定
  
    const pages = findPageFiles(sourceCodeDirectory);
  
    pages.forEach(page => {
      pageRecord[page.name] = {
        entry: page.directory,
        template: path.join(publicFolderPath, `${page.name}.html`),
      }
    })
  }

  // 静态资源等等
  const publicDirectory = fse.existsSync(publicFolderPath) ? publicFolderPath : null;
  const assetsDirectory = fse.existsSync(assetsFolderPath) ? assetsFolderPath : null;

  const homepageHtmlPath = path.join(assetsFolderPath, 'index.html');
  const settingHtmlPath = path.join(assetsFolderPath, 'setting.html');
  const groupSettingHtmlPath = path.join(assetsFolderPath, 'groupSetting.html');

  let appExports = [];
  // 应用导出能力
  if (packageJson?.mybricks?.serviceProvider) {
    for (let serviceName in packageJson?.mybricks?.serviceProvider) {
      const val = packageJson?.mybricks?.serviceProvider[serviceName];
      appExports.push({
        name: serviceName,
        path: `/${packageJson.name}/${val}`,
      });
    }
  }

  // 开始查找服务端资源
  const serverDirectory = path.join(dirFullPath, 'nodejs'); // 约定
  let hasServer = fse.existsSync(serverDirectory)

  const serverModuleDirectory = path.join(serverDirectory, 'index.module.ts') // 约定
  hasServer = hasServer && fse.existsSync(serverModuleDirectory)

  const mapperFolderDirectory = path.join(serverDirectory, 'mapper') // 约定

  const preInstallPath = path.join(dirFullPath, 'preinstall.js')
  const preInstallJsPath = fse.existsSync(preInstallPath) ? preInstallPath : null;


  const extraParams = callback && callback({
    namespace: packageJson.name,
    serverDirectory,
    serverModuleDirectory,
    hasServer,
  }, appName)

  const hasFe = Object.keys(pageRecord).length > 0;

  if (!hasFe && !hasServer) {
    return
  }

  return {
    namespace: packageJson.name,
    appName,
    directory,
    publicDirectory,
    assetsDirectory,
    pages: pageRecord,
    serverDirectory,
    serverModuleDirectory,
    /** 安装的前置hooks */
    preInstallJsPath,
    mapperFolderDirectory: fse.existsSync(mapperFolderDirectory) ? mapperFolderDirectory : null,
    /** 是否包含前端源码 */
    hasFe,
    /** 是否包含服务端代码 */
    hasServer,
    exports: appExports,

    title: packageJson?.mybricks?.title,
    description: packageJson.description,
    icon: packageJson?.mybricks?.icon,
    type: packageJson?.mybricks?.type,
    version: packageJson?.version,
    extName: packageJson?.mybricks?.extName,
    snapshot: packageJson?.mybricks?.snapshot,

    // --- 这里是历史遗留字段，主要在前端页面中使用，后续可以看下还有没有必要存在
    homepage: `/${packageJson.name}/index.html`, // 约定
    _hasPage: fse.existsSync(homepageHtmlPath),

    setting: packageJson?.mybricks?.setting ? packageJson?.mybricks?.setting : (fse.existsSync(settingHtmlPath) ? `/${packageJson.name}/setting.html` : undefined),
    groupSetting: packageJson?.mybricks?.groupSetting ? packageJson?.mybricks?.groupSetting : (fse.existsSync(groupSettingHtmlPath) ? `/${packageJson.name}/groupSetting.html` : undefined),

    isSystem: packageJson?.mybricks?.isSystem ? true : false,
    // --- 这里是历史遗留字段，主要在前端页面中使用，后续可以看下还有没有必要存在

    ...(isObject(extraParams) ? extraParams : {}),
  };
};

function loadAppsFromFolder (appDir, callback) {
  const apps = []

  if (fse.existsSync(appDir)) {
    const folders = fse.readdirSync(appDir);
    if (folders) {
      for (let l = folders.length, i = 0; i < l; i++) {
        const childPath = folders[i]

        try {
          const appFullPath = path.join(appDir, childPath);
          if (!fse.statSync(appFullPath).isDirectory) {
            continue
          }

          const appMeta = scanAppDir(appFullPath, childPath, callback);
          if (!appMeta) {
            continue
          }

          apps.push(appMeta)
        } catch (error) {
          console.log(error)
        }
      }
    }
  }

  return apps
}

function loadApps (callback) {
  if (path.resolve(APPS_FOLDER) === path.resolve(APPS_DEV_FOLDER)) {
    return loadAppsFromFolder(APPS_FOLDER, callback)
  }
  return loadAppsFromFolder(APPS_FOLDER, callback).concat(loadAppsFromFolder(APPS_DEV_FOLDER, callback))
}

module.exports = loadApps