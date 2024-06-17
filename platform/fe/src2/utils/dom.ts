/** 将文本复制到剪贴板 */
export const copyText = (txt: string): boolean => {
  const input = document.createElement('input')
  document.body.appendChild(input)
  input.value = txt
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
  return true
}
