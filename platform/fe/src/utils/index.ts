/** parse JSON string，同时 catch 错误 */
export const safeParse = (content: string, defaultValue = {}) => {
  try {
    return JSON.parse(content);
  } catch {
    return defaultValue;
  }
};