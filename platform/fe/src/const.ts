/** localstorage key 存储我的文件树展开状态 */
export const MYBRICKS_WORKSPACE_DEFAULT_MY_FILETREE = "MYBRICKS_WORKSPACE_DEFAULT_MY_FILETREE";

/** localstorage key 存储协作组文件树展开状态 */
export const MYBRICKS_WORKSPACE_DEFAULT_GROUP_FILETREE = "MYBRICKS_WORKSPACE_DEFAULT_GROUP_FILETREE";

/** localstorage key 存储文件列表视图类型 */
export const MYBRICKS_WORKSPACE_DEFAULT_FILES_VIEWTYPE = "MYBRICKS_WORKSPACE_DEFAULT_FILES_VIEWTYPE";

/** 是否在演示版本内，后续有需要可以做成配置 */
export const IS_IN_BRICKS_ENV = location.hostname.indexOf('mybricks.world') !== -1 || location.hostname.indexOf('localhost') !== -1;
