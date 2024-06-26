/** 清除cookie */
export function removeCookie(name: string) {
  document.cookie = `${name}=;expires=Thu,01 Jan 1970 00:00:00 UTC;path=/;`
}

export const storage = {
  set(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  get(key: string): any {
    return JSON.parse(localStorage.getItem(key));
  }
}
