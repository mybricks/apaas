import dayjs from "dayjs";

interface DynamicFileData {
  id: number;
  name: string;
  extName: string;
  groupId: number;
  parentId: number;
  creatorId: number;
  creatorName: string;
}

interface DefaultFileData {
  icon: string;
  description?: string;
  status: number;
  shareType?: number;
}

interface FileData extends DynamicFileData, DefaultFileData {
  _createTime: number;
  _updateTime: number;
  createTime: string;
  updateTime: string;
}

const defaultFileData: DefaultFileData = {
  icon: "",
  description: null,
  status: 1,
  shareType: null
}

interface MergrFileDataParams extends DynamicFileData {
  createTime: number;
}

const mergrFileData = (fileData: MergrFileDataParams): FileData => {
  const { createTime: _createTime } = fileData;
  const createTime = dayjs(_createTime).format('YYYY-MM-DD HH:mm:ss');

  return {
    ...defaultFileData,
    ...fileData,
    createTime,
    updateTime: createTime,
    _createTime: _createTime,
    _updateTime: _createTime,
  }
}

export {
  FileData,
  mergrFileData
}
