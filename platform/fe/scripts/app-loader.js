const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');

const loadApps = require('./../../../scripts/shared/load-apps')

const HtmlWebpackPlugin = require("html-webpack-plugin");

const getWebpackInfo = (apps) => {
  const app_entries = {};
  const app_plugins = [];

  // 调试用
  const app_static = [];

  // 构建用
  const app_outputs = {};
  const app_meta_map = {};

  apps.forEach(appMeta => {
    app_static.push({
      directory: appMeta.assetsDirectory,
      publicPath: `/${appMeta.appName}`
    });

    app_meta_map[appMeta.appName] = appMeta;

    Object.keys(appMeta.pages).forEach(pageName => {
      const meta = appMeta.pages[pageName];
      app_entries[`${appMeta.appName}_${pageName}`] = meta.entry;
      app_plugins.push(new HtmlWebpackPlugin({
        template: meta.template,
        filename: `${appMeta.appName}/${pageName}.html`,
        chunks: [`${appMeta.appName}_${pageName}`],
      }))
      app_outputs[`${appMeta.appName}_${pageName}`] = `${appMeta.appName}/[name].js`
    })
  });

  return {
    app_entries,
    app_plugins,
    app_static,
    app_outputs,
    app_meta_map,
  }
}

module.exports = function () {
  const apps = loadApps();

  let proxies = [];

  let redirectUrl = null;

  apps.forEach(app => {
    if (app.hasFe && app.assetsDirectory) {
      const proxyConfig = {
        context: [`/${app.appName}`],
        target: 'http://localhost:3100',
        secure: false,
        bypass: function (req, res, proxyOptions) {
          const filePath = path.join(app.assetsDirectory, req.url.replace(`/${app.appName}`, ''));
          if (fse.existsSync(filePath)) {
            // console.log('[资源文件] 转发到应用public文件夹 ' + req.url)
            return req.url
          }
          // console.log('[代理] 转发到服务端 ' + req.url)
        },
      }
      proxies.push(proxyConfig)
    }
    const loginPage = app?.exports?.find(p => p.name === 'login') // mybricks声明里提供了 login serviceProvider 的为登录页面 
    if (loginPage) {
      redirectUrl = loginPage.path;
    }
  })

  if (!redirectUrl) {
    redirectUrl = '/workspace.html'
  }

  return { ...getWebpackInfo(apps), app_proxies: proxies, devRootTraget: redirectUrl }
}