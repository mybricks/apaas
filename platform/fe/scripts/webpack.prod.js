const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const { merge } = require("webpack-merge");
const WebpackBar = require('webpackbar');
const HtmlWebpackPlugin = require("html-webpack-plugin");

const common = require("./webpack.common");


/** webpack输出的临时目录 */
const WEBPACK_DIST_PATH = path.resolve(__dirname, './../dist');

/** 平台的静态资源启动目录 */
const PLATFORM_ASSETS_PATH = path.resolve(__dirname, './../assets');

/** 平台的静态资源存储目录 */
const PLATFORM_PUBLIC_PATH = path.resolve(__dirname, './../public');


const appLoad = require('./app-loader');

const { app_entries, app_outputs, app_meta_map, app_plugins } = appLoad();

/** 将统一构建的应用产物和平台产物放置到 合理的目录，由服务端去起静态服务器 */
class MoveOutputAssetsPlugin {
  constructor() {
  }

  apply(compiler) {

    compiler.hooks.done.tap('MoveOutputAssetsPlugin', () => {
      // 移动 应用的产物到 应用的assets目录
      Object.keys(app_meta_map).forEach(appName => {
        const appMeta = app_meta_map[appName];

        const webpackDistAppPath = path.join(WEBPACK_DIST_PATH, appName);
        const appPublicPath = appMeta.publicDirectory;
        const appAssetsPath = path.join(app_meta_map[appName].directory, 'assets');

        fse.ensureDirSync(appAssetsPath);

        if (fse.pathExistsSync(appPublicPath)) {
          fse.copySync(appPublicPath, appAssetsPath, { overwrite: true });
        }

        if (fse.pathExistsSync(webpackDistAppPath)) {
          fse.copySync(webpackDistAppPath, appAssetsPath, { overwrite: true }); // 将产物移动到应用的assets目录
        }

        try {
          fse.removeSync(webpackDistAppPath);
        } catch (error) {
          
        }
      })

      // 移动 平台的产物到 平台的assets目录
      fse.ensureDirSync(PLATFORM_ASSETS_PATH);
      fse.copySync(PLATFORM_PUBLIC_PATH, PLATFORM_ASSETS_PATH, { overwrite: true });
      fse.copySync(WEBPACK_DIST_PATH, PLATFORM_ASSETS_PATH, { overwrite: true });

      try {
        fse.removeSync(WEBPACK_DIST_PATH);
      } catch (error) {
        
      }
    });
  }
}

module.exports = merge(common, {
  entry: {
    workspace: path.resolve(__dirname, `../src/index.tsx`),
    ...app_entries,
  },
  output: {
    clean: true,
    path: WEBPACK_DIST_PATH,
    filename: (pathData) => {
      return app_outputs[pathData.chunk.name] || '[name].js'
    },
    libraryTarget: 'umd',
    library: '[name]'
  },
  mode: 'production', //设置mode
  plugins: [
    new WebpackBar(),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, `../public/workspace.html`),
      filename: "workspace.html",
      chunks: ['workspace'],
    }),
    ...app_plugins,
    new MoveOutputAssetsPlugin({ rootTargetPath: '', appNames: {} })
  ]
})
