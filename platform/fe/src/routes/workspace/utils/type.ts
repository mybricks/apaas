export function isObject(v: any) {
  return v !== null && v !== undefined && typeof v === 'object' && !Array.isArray(v)
}
