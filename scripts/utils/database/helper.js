module.exports.validateDatabase = function validateDatabase (dbConfig) {
  if (!dbConfig) {
    throw new Error('数据库配置不存在')
  }

  if (!dbConfig?.database) {
    throw new Error('数据库配置 database 未配置')
  }

  if (!dbConfig?.host) {
    throw new Error('数据库配置 host 未配置')
  }

  if (!dbConfig?.user) {
    throw new Error('数据库配置 user 未配置')
  }

  if (dbConfig?.dbType?.toUpperCase() !== 'MYSQL') {
    throw new Error(`数据库需要为MYSQL，当前配置为${config.database.dbType}`)
  }
}
