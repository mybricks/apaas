const Log = require('./utils/log')
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const inquirer = require('inquirer');
const os = require('os');
const crypto = require('crypto');

const upgradeLog = Log('MyBricks: 更新脚本')

// 计算文件的哈希值
function getFileHash(filePath) {
  const hash = crypto.createHash('sha256');
  const fileBuffer = fs.readFileSync(filePath);
  hash.update(fileBuffer);
  return hash.digest('hex');
}

async function forEachFileFromFiles(parentDir, files, { blackList = [] }, callback) {
  for (const file of files) {
    const curPath = path.join(parentDir, file);

    if (!await fs.exists(curPath)) {
      continue
    }
    const fileStat = await fs.stat(curPath);

    if (blackList.includes(file)) {
      continue
    }

    if (fileStat.isDirectory()) {
      const nextFiles = await fs.readdir(curPath);
      callback?.(fileStat, curPath)
      await forEachFileFromFiles(curPath, nextFiles, { blackList }, callback)
    } else if (fileStat.isFile()) {
      callback?.(fileStat, curPath)
    }
  }
}

const DEFAULT_BLACK_LIST = ['node_modules', 'package-lock.json', '.gitignore', 'yarn.lock', 'pnpm-lock.yaml', 'npm-debug.log', '.npmrc', '.DS_Store'];

/** 将两个代码文件夹同步成一致的方法 */
async function syncSourceCodeByDiff(files, {
  sourceCodePath,
  destCodePath
}, {
  blackList = DEFAULT_BLACK_LIST
} = {
  blackList: DEFAULT_BLACK_LIST
}) {
  const operations = [];

  await forEachFileFromFiles(sourceCodePath, files, { blackList }, (fileStat, sourcePath) => {
    const relativePath = path.relative(sourceCodePath, sourcePath);
    const destPath = path.join(destCodePath, relativePath);

    if (fs.pathExistsSync(sourcePath)) {
      if (fs.pathExistsSync(destPath)) { // 源码目录存在，目标目录存在
        if (fileStat.isFile()) { // 判断文件是否修改，修改了则视为修改操作
          const srcHash = getFileHash(sourcePath);
          const destHash = getFileHash(destPath);
          if (srcHash !== destHash) {
            operations.push({ type: 'modify', src: sourcePath, dest: destPath });
          }
        }
      } else { // 源码目录存在，目标目录不存在，新增操作
        operations.push({ type: 'add', src: sourcePath, dest: destPath });
      }
    } else if (fs.pathExistsSync(destPath)) { // 源码目录不存在，目标目录存在，删除操作
      operations.push({ type: 'delete', path: destPath });
    }
  })

  console.log('即将进行以下操作:');
  for (const op of operations) {
    const relativePath = path.relative(destCodePath, op.dest || op.path);
    if (op.type === 'add') {
      console.log(`新增：    ${relativePath}`);
    } else if (op.type === 'modify') {
      console.log(`修改：    ${relativePath}`);
    } else if (op.type === 'delete') {
      console.log(`删除：    ${relativePath}`);
    }
  }

  console.log(`当前目录代码与源代码文件差异如上，共包含 ${operations.length} 处修改`)

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `是否确认执行上述文件更新?`,
    },
  ]);

  if (confirm) {
    for (const op of operations) {
      if (op.type === 'add' || op.type === 'modify') {
        await fs.copy(op.src, op.dest, { overwrite: true });
      } else if (op.type === 'delete') {
        await fs.remove(op.path);
      }
    }
    upgradeLog.log('更新完成');
  }
}

const SOURCE_TYPE = {
  GIT: '官方Git仓库',
  LOCAL: '本地文件夹',
}

async function main() {
  const { sourceType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'sourceType',
      message: '请选择从哪里更新平台代码:',
      choices: [SOURCE_TYPE.GIT, SOURCE_TYPE.LOCAL],
    },
  ]);

  let sourceCodePath;
  if (sourceType === SOURCE_TYPE.GIT) {
    const gitRepo = 'https://github.com/mybricks/apaas.git';

    const tempDir = path.join(os.tmpdir(), 'update-script-temp');
    await fs.remove(tempDir); // 清理临时目录
    await fs.ensureDir(tempDir); // 确保临时目录存在

    await new Promise((resolve, reject) => {
      const execCommand = `git clone ${gitRepo} ${tempDir}`;
      upgradeLog.log(`即将执行 ${execCommand} 命令，获取源代码`)
      exec(execCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`克隆仓库失败: ${stderr}`);
          upgradeLog.log(`获取源代码失败`)
          reject(error);
        } else {
          console.log(`克隆仓库成功: ${stdout}`);
          upgradeLog.log(`获取源代码成功`)
          resolve();
        }
      });
    });

    sourceCodePath = tempDir;
  } else {
    const { localDir } = await inquirer.prompt([
      {
        type: 'input',
        name: 'localDir',
        message: '请输入本地文件夹路径:',
        validate: input => fs.existsSync(input) ? true : '路径不存在，请重新输入',
      },
    ]);
    sourceCodePath = localDir;
  }

  const destCodePath = process.cwd();

  const packageJsonPath = path.join(sourceCodePath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    upgradeLog.error('源代码中package.json 文件不存在，请检查源代码')
    upgradeLog.error(`源代码路径为 ${sourceCodePath}`)
    return;
  }

  const packageJson = await fs.readJson(packageJsonPath);
  const files = packageJson.files || [];

  if (files.length === 0) {
    upgradeLog.error('源代码 package.json 中没有 files 字段或 files 字段为空，请检查源代码')
    return;
  }

  // 同步平台代码
  await syncSourceCodeByDiff(files, { sourceCodePath, destCodePath })

  // 同步开源登录应用代码
  const LOGIN_APP_PATH = 'apps/mybricks-open-login';
  const sourceLoginAppPath = path.join(sourceCodePath, LOGIN_APP_PATH);
  const destLoginAppPath = path.join(destCodePath, LOGIN_APP_PATH);
  if (await fs.exists(destLoginAppPath)) {
    console.log(`检测到开源登录应用存在，开源应用目录为   ${LOGIN_APP_PATH}`)
    const { confirm: loginConfirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `是否同步开源登录应用代码`,
      },
    ]);

    if (loginConfirm) {
      await syncSourceCodeByDiff(['fe', 'nodejs', 'package.json'], { sourceCodePath: sourceLoginAppPath, destCodePath: destLoginAppPath })
    }
  }

  // 同步文件存储目录
  // TODO
}

main().catch(err => {
  upgradeLog.error('发生错误')
  console.error(err.stack.toString());
});