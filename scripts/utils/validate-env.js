const fse = require('fs-extra')
const path = require('path')

const startInitDatabase = require('./database/init')

function validateDepEnv () {
  
}

module.exports = async function validateEnv ({ console }) {
  await startInitDatabase({ console })
}