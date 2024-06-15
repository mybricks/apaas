const fse = require('fs-extra')
const AdmZip = require('adm-zip')
const axios = require('axios');
const path = require('path');

const { FILE_LOCAL_STORAGE_FOLDER } = require('./../env')

const ASSETS_ZIP_URL = 'https://assets.material.mybricks.world/preset-assets.zip';

const TEMP_PATH = path.resolve(__dirname, './../../_temp_', '_temp_assets_update_');
const tempZipPath = path.join(TEMP_PATH, 'assets-update-pkg.zip');
const outputDir = path.join(TEMP_PATH, 'assets-update');

module.exports = async function assetsUpdate ({ console }) {

  await fse.ensureDir(TEMP_PATH);
  await fse.ensureDir(FILE_LOCAL_STORAGE_FOLDER);

  try {
    console.log('开始下载静态资源依赖...')

    // 下载 zip 文件
    const response = await axios({
      url: ASSETS_ZIP_URL,
      method: 'GET',
      responseType: 'arraybuffer'
    });
    
    // 将下载的内容写入临时 zip 文件
    await fse.writeFile(tempZipPath, response.data);

    console.log('下载成功，开始解压静态资源依赖...')
    // 解压 zip 文件
    const zip = new AdmZip(tempZipPath);
    zip.extractAllTo(outputDir, true);

    if (await fse.pathExists(path.join(outputDir, '__MACOSX'))) {
      await fse.remove(path.join(outputDir, '__MACOSX'))
    }
    console.log(`解压成功，开始复制静态资源依赖，目标地址 ${FILE_LOCAL_STORAGE_FOLDER}`)
    await fse.copy(outputDir, FILE_LOCAL_STORAGE_FOLDER, { overwrite: true })
    console.log('复制静态资源依赖成功')
  } catch (error) {
    if (error.response) {
      switch (error.response.status) {
        case 404:
          console.error('静态资源依赖文件不存在 (404)');
          break;
        default:
          console.error(`请求静态资源依赖失败，状态码 ${error.response.status}`);
      }
    } else if (error.request) {
      console.error('无法访问静态资源依赖文件 CDN 地址');
    }
  } finally {
    // 删除临时 zip 文件
    if (await fse.pathExists(TEMP_PATH)) {
      await fse.remove(TEMP_PATH);
    }
  }
}