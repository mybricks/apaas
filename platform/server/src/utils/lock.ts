const fs = require('fs');
import { Logger } from '@mybricks/rocker-commons'

import env from './env'

const lockUpgrade = async () => {
  return new Promise(async (resolve, reject) => {
    fs.open(env.FILE_UPGRADE_LOCK_FILE, 'wx', (err, fd) => {
      if (err) {
        const birthtimeMs = fs.statSync(env.FILE_UPGRADE_LOCK_FILE).birthtimeMs
        if(Date.now() - birthtimeMs > 5 * 60 * 1000) {
          // 如果五分钟直接解锁
          fs.unlinkSync(env.FILE_UPGRADE_LOCK_FILE)
          Logger.info('[应用锁] 超过五分钟直接解锁')
          resolve(fd)
          return
        }
        // 加锁失败，执行回调函数
        reject(err)
        return
      } else {
        resolve(fd)
      }
    });
  })
}

const unLockUpgrade = async (param: { fd?: any, force: boolean }) => {
  return new Promise((resolve, reject) => {
    const { fd, force = true } = param
    if(force) {
      fs.unlink(env.FILE_UPGRADE_LOCK_FILE, (err) => {
        if(err) {
          Logger.error(`[应用锁] 强制解锁失败 ${err?.message}`)
        }
        resolve(true)
      })
    } else {
      fs.close(fd, (err) => {
        if (err) {
          Logger.error(`[应用锁] 解锁失败 ${err?.message}`)
        } else {
          resolve(true)
        }
      })
    }
  })
}

export {
  lockUpgrade,
  unLockUpgrade
}