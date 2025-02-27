import axios from 'axios'

export function uploadToStaticServer({ content, folderPath, fileName, noHash }: { content: any, folderPath: string, fileName: string, noHash?: boolean }): Promise<{ url: string }> {
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