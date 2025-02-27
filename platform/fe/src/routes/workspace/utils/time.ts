import dayjs from "dayjs";

/**
 * 统一展示时间处理
 * @param time 时间
 * @returns    最终展示的时间格式
 */
export function unifiedTime(time) {
  if (isToday(time)) {
    return dayjs(time).format('HH:mm')
  } else if (isThisYear(time)) {
    return dayjs(time).format('M月D日 HH:mm')
  }

  return dayjs(time).format('YYYY年M月D日')
}

/**
 * 判断时间是否今天
 * @param time 时间
 * @returns    是否今天
 */
function isToday(time) {
  const t = dayjs(time).format('YYYY-MM-DD')
  const n = dayjs().format('YYYY-MM-DD')

  return t === n
}

/**
 * 判断时间是否今年
 * @param time 时间
 * @returns    是否今年
 */
function isThisYear(time) {
  const t = dayjs(time).format('YYYY')
  const n = dayjs().format('YYYY')

  return t === n
}
