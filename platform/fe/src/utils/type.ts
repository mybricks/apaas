export function isDefined(v: any) {
  return v !== undefined
}

export function isObject(v: any) {
  return v !== null && v !== undefined && typeof v === 'object' && !Array.isArray(v)
}

export function isBoolean(v: any) {
  return v === true || v === false
}

export function isNumber(v: any) {
  return v !== undefined && (typeof v === 'number' || v instanceof Number) && isFinite(v)
}

export function isString(v: any) {
  return v !== null && v !== undefined && (typeof v === 'string' || v instanceof String)
}

export function isArray(v: any) {
  return Array.isArray(v)
}

export function isFunction(v: any) {
  return typeof v === 'function'
}

