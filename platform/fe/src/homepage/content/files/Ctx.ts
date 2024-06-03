import {storage} from '../../../utils'
import {MYBRICKS_WORKSPACE_DEFAULT_FILES_VIEW_TYPE} from '../../../const'

export const folderExtnames = ['folder', 'folder-project', 'folder-module']

export default class Ctx {
  user: { id, name, email }

  parentId: string | null

  groupId: string | null

  popCreate: boolean

  folderExtName: null | string | undefined = undefined

  path: Array<{ id: null | number, name: string, parentId: null | number, groupId: null | number, extName: null | string }> = []

  roleDescription: 1 | 2 | 3

  projectList: null | Array<any> = null

  /**
   * @param pushState 是否操作路由
   */
  getAll: (any) => void;

  /**
   * @param id 文件夹Id
   * @param pushState 是否操作路由
   */
  setPath: (any) => void;

  showCreatePanel() {
    this.popCreate = true
  }

  hideCreatePanel() {
    this.popCreate = false
  }

  viewType = storage.get(MYBRICKS_WORKSPACE_DEFAULT_FILES_VIEW_TYPE) || 'card'

  setViewType() {
    storage.set(MYBRICKS_WORKSPACE_DEFAULT_FILES_VIEW_TYPE, this.viewType = (this.viewType === 'card' ? 'list' : 'card'))
  }
}
