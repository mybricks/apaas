import * as path from 'path';
import * as fse from 'fs-extra';
import * as os from 'os'

const AdmZip = require('adm-zip')


export async function zipDirectory(dir: string, fileName: string) {
  // 创建一个新的 zip 实例
  const zip = new AdmZip();

  // // 将文件夹添加到 zip 对象中
  zip.addLocalFolder(dir);

  // 确定 zip 文件的路径
  const targetPath = path.join(os.tmpdir(), fileName);

  // 将 zip 内容写入文件
  zip.writeZip(targetPath);

  return targetPath
}