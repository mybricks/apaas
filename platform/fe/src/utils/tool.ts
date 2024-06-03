import axios from 'axios'
import moment from 'moment'

/** 文件列表排序 */
export function fileSort(files) {
  /** 参与排序替换位置，数字越大越靠前 */
  const orderMap = {
    'folder': 1,
    'folder-project': 3,
    'folder-module': 2
  }
  return files.sort((c, s) => {
    const cNum = orderMap[c.extName] || -1
    const sNum = orderMap[s.extName] || -1

    return sNum - cNum
  })
}

/**
 * 统一展示时间处理
 * @param time 时间
 * @returns    最终展示的时间格式
 */
export function unifiedTime(time) {
  if (isToday(time)) {
    return moment(time).format('HH:mm')
  } else if (isThisYear(time)) {
    return moment(time).format('M月D日 HH:mm')
  }

  return moment(time).format('YYYY年M月D日')
}

/**
 * 判断时间是否今天
 * @param time 时间
 * @returns    是否今天
 */
function isToday(time) {
  const t = moment(time).format('YYYY-MM-DD')
  const n = moment().format('YYYY-MM-DD')

  return t === n
}

/**
 * 判断时间是否今年
 * @param time 时间
 * @returns    是否今年
 */
function isThisYear(time) {
  const t = moment(time).format('YYYY')
  const n = moment().format('YYYY')

  return t === n
}

export function staticServer({content, folderPath, fileName, noHash}: any): Promise<{url: string}> {
  let blob = new Blob([content])
  let formData = new window.FormData()
 
  formData.append('file', blob, fileName)
  formData.append('folderPath', folderPath)
  noHash && formData.append('noHash', JSON.stringify(noHash))

  return new Promise((resolve, reject) => {
    axios
      .post('/paas/api/flow/saveFile', formData)
      .then(({ data }: any) => {
        if (data.code === 1 && data.data) {
          resolve(data.data)
        } else {
          reject('上传失败')
        }
      })
  })
}

export function uuid(length = 32): string {
  let text = '';

  const possible1 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  const possible2 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (let i = 0; i < length; i++) {
    if(i === 0) {
      text += possible1.charAt(Math.floor(Math.random() * possible1.length))
    } else {
      text += possible2.charAt(Math.floor(Math.random() * possible2.length))
    }
  }

  return text
}
