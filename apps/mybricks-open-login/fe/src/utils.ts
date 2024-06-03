export function getApiUrl(uri) {
  // @ts-ignore
  const env = typeof ENV === 'undefined' ? void 0 : ENV//defined by webpack
  return env ? `http://localhost:3100${uri}`
    : `${uri}`
}

export function setCookie(name, value, exdays) {
  const d = new Date()
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000))

  // @ts-ignore
  const expires = "expires=" + d.toGMTString()
  document.cookie = name + "=" + value + "; " + expires + "; path=/;"
}

export function getCookie(name) {
  name = name + "="
  const ca = document.cookie.split(';')

  for (let i = 0; i < ca.length; i++) {
    const c = ca[i].trim();
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
}

export function removeCookie(name) {
  document.cookie = `${name}=;expires=Thu,01 Jan 1970 00:00:00 UTC;path=/;`
}

export function getUrlQuery (baseUrl = location.search) {
  const query = baseUrl.slice(1)
  const obj: any = {}
  const arr: any = query.split('&')
  for (var i = 0; i < arr.length; i++) {
    let val = arr[i]
    if (val) {
      val = val.split('=')
      obj[val[0]] = val[1]
    }
  }
  return obj
}

