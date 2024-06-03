const { APPS_FOLDER } = require('./../../scripts/env.js')

const getAppThreadName = () => {
  try {
    const ecosystemConfig = require("./ecosystem.config.js");
    // @ts-ignore
    return ecosystemConfig?.apps?.[0]?.name ?? 'index'
  } catch(e) {
    console.log(e)
    return 'index'
  }
}

module.exports = {
  APPS_FOLDER,
  getAppThreadName
}