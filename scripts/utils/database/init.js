
const fs = require('fs-extra');
const path = require('path');

const { SQL_PATH } = require('./../../env')
const { MySqlExecutor, loadApps, readUserConfig } = require('./../../shared')
const { validateDatabase } = require('./helper')
const userConfig = readUserConfig();

async function _initDatabase({ execSqlAsync, console }) {
  await execSqlAsync(`create database IF NOT EXISTS \`${userConfig.database.database}\` default charset utf8mb4;`)
  await execSqlAsync(`use \`${userConfig.database.database}\`;`)
  console.log(`数据库database ${userConfig.database.database} 已准备完成`)
}

async function _initDatabaseTables({ execSqlAsync, console }) {
  let dirs = fs.readdirSync(SQL_PATH)
  for(let l = dirs?.length, i = 0; i < l; i++) {
    if(dirs[i] !== '.DS_Store') {
      const tableName = dirs?.[i]?.split('.')[0];
      const fullPath = path.join(SQL_PATH, dirs[i]);
      const sqlStr = fs.readFileSync(fullPath, 'utf-8').toString();
      const temp = sqlStr.replace(/\n/g, '')
      await execSqlAsync(temp)
    }
  }
  console.log(`平台数据表共计 ${dirs.length} 张准备完成`)
}

async function _initDatabaseRecord({ execSqlAsync, console }) {
  if (userConfig?.adminUser?.email && userConfig?.adminUser?.password) {
    const [results, fields] = await execSqlAsync(`SELECT * FROM \`${userConfig.database.database}\`.\`apaas_user\` WHERE \`email\` = "${userConfig.adminUser.email}" LIMIT 1`)
    if (!results.length) {
      const insertUser = `
        INSERT INTO \`${userConfig.database.database}\`.\`apaas_user\` (\`email\`, \`password\`, \`create_time\`, \`update_time\`, \`status\`, \`role\`) VALUES ('${userConfig.adminUser.email}', '${Buffer.from(userConfig.adminUser.password).toString('base64')}', ${Date.now()}, ${Date.now()}, 1, 10);
      `
      await execSqlAsync(insertUser)
    }
    console.log(`管理员信息初始化成功`)
  }
}

async function _initAppsDatabase ({ execSqlAsync, console }) {
  const localApps = loadApps().filter(t => !!t.preInstallJsPath) // 通过有没有前端源码来判断是不是本地的应用
  for(let i = 0; i < localApps.length; i++) {
    const app = localApps[i];
    if (path.extname(app.preInstallJsPath) === '.js') {
      console.log(`正在执行应用 ${app.appName} 的初始化逻辑...`)
      const installFunction = require(app.preInstallJsPath);
      await installFunction({ execSql: execSqlAsync })
      console.log(`应用 ${app.appName} 的初始化逻辑执行成功`)
    }
  }
}

module.exports = async function startInitDatabase ({ console }) {
  console.log(`开始检测数据库`)
  const mySqlExecutor = MySqlExecutor()
  console.log(`数据库连接中...`)
  try {
    await mySqlExecutor.connect()

    validateDatabase(userConfig.database)
    
    await _initDatabase({ execSqlAsync: mySqlExecutor.execSqlAsync, console });
    await _initDatabaseTables({ execSqlAsync: mySqlExecutor.execSqlAsync, console });
    await _initDatabaseRecord({ execSqlAsync: mySqlExecutor.execSqlAsync, console });
    await _initAppsDatabase({ execSqlAsync: mySqlExecutor.execSqlAsync, console })
    console.log(`数据库准备完毕`)
  } catch (error) {
    console.error(error)
    // 脚本文件，不成功直接退出进程
    await mySqlExecutor.closeConnection();
    throw new Error('数据初始化操作失败')
  }
  await mySqlExecutor.closeConnection();
  console.log(`数据库执行环境已退出`)
}