const fse = require('fs-extra')
const AdmZip = require('adm-zip')
const axios = require('axios');
const path = require('path');
const inquirer = require('inquirer');

const { FILE_LOCAL_STORAGE_FOLDER } = require('./../env')

const ASSETS_ZIP_URL = 'https://assets.material.mybricks.world/preset-assets.zip';

const TEMP_PATH = path.resolve(__dirname, './../../_temp_', '_temp_assets_update_');
const tempZipPath = path.join(TEMP_PATH, 'assets-update-pkg.zip');
const outputDir = path.join(TEMP_PATH, 'assets-update');

module.exports = async function assetsUpdate ({ console }) {

  await fse.ensureDir(TEMP_PATH);
  await fse.ensureDir(FILE_LOCAL_STORAGE_FOLDER);

  try {
    console.log('开始下载静态资源包...')

    // 下载 zip 文件
    const response = await axios({
      url: ASSETS_ZIP_URL,
      method: 'GET',
      responseType: 'arraybuffer'
    });
    
    // 将下载的内容写入临时 zip 文件
    await fse.writeFile(tempZipPath, response.data);

    console.log('下载成功')
    await installFromZip(tempZipPath, { console })
    
  } catch (error) {
    let errMessage;
    if (error.response) {
      switch (error.response.status) {
        case 404:
          errMessage = '静态资源包不存在 (404)';
          break;
        default:
          errMessage = `获取静态资源包失败，状态码 ${error.response.status}`;
      }
    } else if (error.request) {
      errMessage = '无法访问静态资源包 CDN 地址';
    }
    
    if (!errMessage) {
      errMessage = `获取静态资源包失败：${error?.stack?.toString() ?? error?.message}`;
    }
    
    console.warn(errMessage);
    await suggestInstallFromLocalPath({ console })

  } finally {
    // 删除临时 zip 文件
    if (await fse.pathExists(TEMP_PATH)) {
      await fse.remove(TEMP_PATH);
    }
  }
}

async function installFromZip (zipDir, { console }) {
  console.log(`开始解压静态资源`)
  // 解压 zip 文件
  const zip = new AdmZip(zipDir);
  zip.extractAllTo(outputDir, true);

  if (await fse.pathExists(path.join(outputDir, '__MACOSX'))) {
    await fse.remove(path.join(outputDir, '__MACOSX'))
  }
  console.log(`解压成功，开始复制静态资源依赖，目标地址 ${FILE_LOCAL_STORAGE_FOLDER}`)
  await fse.copy(outputDir, FILE_LOCAL_STORAGE_FOLDER, { overwrite: true })
  console.log('复制静态资源依赖成功')
}

async function suggestInstallFromLocalPath ({ console }) {
  console.log(`建议手动从 ${ASSETS_ZIP_URL} 下载依赖`)
  const { localDir } = await inquirer.prompt([
    {
      type: 'input',
      name: 'localDir',
      message: '请输入下载好的压缩包路径：',
      validate: input => fse.existsSync(input) && path.extname(input) === '.zip' ? true : '压缩包不存在，请重新输入',
    },
  ]);

  await installFromZip(localDir, { console })
}