/** 字符串集合包含了大小写字母和数字 */
const UUID_CHARTS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** 从0-9a-zA-Z挑选字符随机生成id */
const uuid = (length: number = 2) => {
  let id = '';
  // 随机选取字符长度
  for (let i = 0; i < length; i++) {
    id += UUID_CHARTS.charAt(Math.floor(Math.random() * UUID_CHARTS.length));
  }
  return id;
}

export {
  uuid
}
