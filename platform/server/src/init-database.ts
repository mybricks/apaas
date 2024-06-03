import { start as startDB } from "@mybricks/rocker-dao";
import * as fse from 'fs-extra'
import * as path from "path";

const userConfig = require('./../../../scripts/shared/read-user-config.js')();

const MYBATIS_SQL_FOLDER = path.join(__dirname, './../../../_mybatis');

export default function initDatabase(mapperPaths: string[]) {

  let dbConfig = userConfig.database;

  initMybatisSqls(mapperPaths);

  startDB([
    {
      dbType: dbConfig.dbType,
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port,
      database: dbConfig.database,
      sqlPath: './../../../_mybatis',  // 这里只支持相对路径
      isGlobal: true,
      bootstrapPath: __dirname
    },
  ]);
}


/** rocker-dao需要一个sql目录，将所有应用和平台的xml文件复制到一个路径 */
function initMybatisSqls (mapperPaths) {
  fse.ensureDirSync(MYBATIS_SQL_FOLDER);

  // 拷贝平台xml
  fse.copySync(path.resolve(__dirname, './resource'), MYBATIS_SQL_FOLDER, { overwrite: true });

  // 拷贝应用xml
  if (Array.isArray(mapperPaths)) {
    for (let index = 0; index < mapperPaths.length; index++) {
      const mapperPath = mapperPaths[index];
      fse.copySync(mapperPath, MYBATIS_SQL_FOLDER, { overwrite: true });
    }
  }
}
