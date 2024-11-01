import { Sequelize, QueryTypes } from 'sequelize'
import * as crypto from 'crypto';

const { SnowFlake } = require('gen-uniqueid');
const SNOW_FLAKE = new SnowFlake({ workerId: process.env.WorkerId == undefined ? 1 : process.env.WorkerId });

function genMainIndexOfDB() {
  return SNOW_FLAKE.NextId();
}

export interface MySqlCreateOption {
  dialect: 'mysql',
  host: string,
  database: string,
  username: string,
  password: string
}

class DbPoolManager {
  dbMap = new Map<string, Sequelize>()

  private getDbKeyFromCreateOptions = (opt: MySqlCreateOption) => {
    return `${opt.dialect}_${opt.database}_${encodeURIComponent(opt.host)}`
  }

  private initDbConnect = async (dbOpt: MySqlCreateOption) => {
    const {
      dialect,
      host,
      database,
      username,
      password,
    } = dbOpt
    const sequelize = new Sequelize(database, username, password, {
      host: host,
      dialect
    });

    this.dbMap.set(this.getDbKeyFromCreateOptions(dbOpt), sequelize)
    return sequelize
  }


  getDbConnect = async (opt: MySqlCreateOption) => {
    const dbKey = this.getDbKeyFromCreateOptions(opt)

    if (!this.dbMap.has(dbKey)) {
      return await this.initDbConnect(opt)
    }
    return this.dbMap.get(dbKey)
  }
}

const dbPoolManager = new DbPoolManager()


const jwt = require('jsonwebtoken');


export const getExecEnv = async ({
  databaseOption
}: { databaseOption: MySqlCreateOption }) => {
  let executeSql
  
  if (databaseOption) {
    // 兼容没 dialect 的情况
    if (!databaseOption?.dialect) {
      databaseOption.dialect = 'mysql'
    }
    const dbConnect = await dbPoolManager.getDbConnect(databaseOption)
    executeSql = async (query) => {
      // @ts-ignore
      const [result, metadata] = await dbConnect.query({ query })
      if (Array.isArray(result)) {
        return {
          rows: result
        }
      }
      if (typeof result === 'number' || typeof result === 'string') {
        return {
          insertId: result
        }
      }
      return {
        rows: result,
      }
    }
  } else {
    executeSql = async () => {
      console.log('当前未配置数据库，不支持执行SQL')
    }
  }

  return {
    runtime: true,
    // 加解密暂时不支持，按理说应该由用户自己来配置
    encrypt: (str) => {
      return str
    },
    decrypt: (str) => {
      return str
    },
    jwt: {
      sign: jwt.sign,
      verify: jwt.verify,
    },
    crypto: {
      pbkdf2: crypto.pbkdf2,
      createHash: crypto.createHash,
    },
    genUniqueId: genMainIndexOfDB,
    executeSql,
  }
}