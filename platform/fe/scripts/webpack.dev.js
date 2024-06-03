const path = require('path');
const { merge } = require("webpack-merge");
const WebpackBar = require('webpackbar');
const HtmlWebpackPlugin = require("html-webpack-plugin");

const common = require("./webpack.common");

const appLoad = require('./app-loader');

const { app_entries, app_static, app_proxies, app_plugins, devRootTraget } = appLoad();

module.exports = merge(common, {
  entry: {
    workspace: path.resolve(__dirname, `../src/index.tsx`),
    ...app_entries,
  },
  output: {
    filename: './js/[name].js',
    libraryTarget: 'umd',
    library: '[name]'
  },
  mode: 'development', //设置mode
  devtool: 'cheap-source-map',//devtool: 'cheap-source-map',
  devServer: {
    static: [
      path.resolve(__dirname, `./../public`),
      ...app_static,
    ],
    port: 3101,
    host: '0.0.0.0',
    allowedHosts: "all",
    client: {
      logging: 'warn',
    },
    bonjour: {
      type: 'http',
    },
    open:true,
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      devServer.app.get('/', (_, response) => {
        response.redirect(devRootTraget)
      });
      
      return middlewares;
    },
    proxy: [
      {
        context: ['/paas', '/api', '/mfs'],
        target: 'http://localhost:3100',
        secure: false,
        changeOrigin: true,
      },
      ...app_proxies
    ]
  },
  plugins: [
    new WebpackBar(),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, `../public/workspace.html`),
      filename: "workspace.html",
      chunks: ['workspace'],
    }),
    ...app_plugins,
  ]
})