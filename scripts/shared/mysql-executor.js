

const fs = require('fs-extra');
const path = require('path');
const mysql = require('mysql2/promise');

const readUserConfig = require('./read-user-config');

const mySqlExecutor = () => {
  let MYSQL_CONNECTION = null
  return {
    connect: async () => {
      const userConfig = readUserConfig();
      MYSQL_CONNECTION = await mysql.createConnection({
        host: userConfig.database.host,
        user: userConfig.database.user,
        password: userConfig.database.password,
        port: userConfig.database.port
      });
    },
    connectInDatabase: async () => {
      const userConfig = readUserConfig();
      MYSQL_CONNECTION = await mysql.createConnection({
        host: userConfig.database.host,
        user: userConfig.database.user,
        password: userConfig.database.password,
        port: userConfig.database.port,
        database: userConfig.database.database
      });
    },
    execSqlAsync: async (sql) => {
      return MYSQL_CONNECTION.query(sql)
    },
    closeConnection: async () => {
      if(MYSQL_CONNECTION && MYSQL_CONNECTION.end) {
        await MYSQL_CONNECTION.end()        
      }
    }
  }
}

module.exports = mySqlExecutor