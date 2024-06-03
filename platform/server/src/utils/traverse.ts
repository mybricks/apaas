import { getStringBytes } from './logger'
import { maxLogRowContent, maxAboutWord } from '../constants'
import fs from 'fs'

/** 处理请求body 或 params 数据，对于过长的进行处理 */
export function formatBodyOrParamsData(data: Record<string, any>) {
  let result = {}

  const maxContentVal = '参数过长，无法展示'
  for (let key in data) {
    let val = data[key]
    result[key] = val
    if ((typeof val === 'object' && val !== null)) {
      let stringVal = JSON.stringify(val)
      if (stringVal.length > maxAboutWord && getStringBytes(stringVal) > maxLogRowContent) {
        result[key] = maxContentVal
      }
    }
    else if (typeof val === 'string') {
      if (val.length > maxAboutWord && getStringBytes(val) > maxLogRowContent) {
        result[key] = maxContentVal
      }
    }
  }

  return result
}