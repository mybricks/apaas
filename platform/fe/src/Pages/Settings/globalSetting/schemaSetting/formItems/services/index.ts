import { fAxios } from './http'

export const FileService = {
  getFiles: async ({ extName }) => {
    const { data: files, code } = await fAxios.get(
      `/api/file/get?extName=${extName}`
    )
    if (code === 1 && files) {
      return files
    }
    throw new Error('invalid files')
  },
  getSysTemFiles: async ({ extName }) => {
    const { data: files, code } = await fAxios.get(
      `/api/file/getSysTemFiles?extName=${extName}`
    )
    if (code === 1 && files) {
      return files
    }
    throw new Error('invalid files')
  }
}

export const VersionService = {
  getPublishVersions: async ({ fileId, pageSize = 10, pageIndex = 1 }) => {
    const { data: versions, code } = await fAxios.get(
      `/api/workspace/publish/versions?fileId=${fileId}&pageSize=${pageSize}&pageIndex=${pageIndex}`
    )
    if (code === 1 && versions) {
      return versions
    }
    throw new Error('invalid versions')
  },
}
