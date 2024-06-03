const fse = require('fs-extra')
const path = require('path')

const startInitDatabase = require('./database/init')

function validateDevEnv () {
  
}

module.exports = async function validateEnv ({ console }) {
  console.log(`开始检测数据库`)
  await startInitDatabase({ console })
  console.log('数据库检测完成')
}