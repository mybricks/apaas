export * from './url'
export * from './dom'
export * from './type'
export * from './tool'
export * from './storage'

/**
 * @description 是否在演示版本内，后续有需要可以做成配置
 */
export const isInBricksEnv = location.hostname.indexOf('mybricks.world') !== -1 || location.hostname.indexOf('localhost') !== -1
