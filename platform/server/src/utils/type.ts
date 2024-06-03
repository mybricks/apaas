/**
 * 数字
 * @param   value 任意值 
 * @returns boolean
 */
export function isNumber (value: any): boolean {
  return typeof value === 'number' && !isNaN(value);
}
