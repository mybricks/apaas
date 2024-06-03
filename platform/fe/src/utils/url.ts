export function getApiUrl(uri) {
  const env = typeof ENV === 'undefined' ? void 0 : ENV//defined by webpack
  return env ? `http://localhost:8080${uri}`
    : `${uri}`
}

export function getQueryString(name) {
  const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");

  const r = window.location.search.substring(1).match(reg);
  if (r != null) {
    return r[2]
  }
  return null;
}

export function pushUrlVal(paramName: string, replaceWith?: string, config = {url: location.search, init: false} as {url?: string, init?: boolean}): void {
  const { url = location.search, init = false } = config;
  const oldUrl = url;
  let newUrl: undefined | string = oldUrl;

  if (!replaceWith) {
    newUrl = deleteUrlVal(paramName);
  } else if (init) {
    newUrl = `?${paramName}=${replaceWith}`;
  } else if (oldUrl) {
    const re = eval('/('+ paramName+'=)([^&]*)/gi');
    if (re.test(oldUrl)) {
      newUrl = oldUrl.replace(re, paramName+'='+replaceWith);
    } else {
      newUrl = oldUrl + `&${paramName}=${replaceWith}`;
    }
  } else {
    newUrl = `?${paramName}=${replaceWith}`;
  }

  if (newUrl) {
    history.pushState(getUrlQuery(newUrl), '', newUrl);
  }
}

export function getUrlQuery (baseUrl = location.search) {
  if (!baseUrl) return {}
  const query = baseUrl.slice(1);
  const obj: any = {}
  const arr: any = query.split("&");
  for (var i = 0; i < arr.length; i++) {
    let val = arr[i];
    if (val) {
      val = val.split("=");
      obj[val[0]] = val[1];
    }
  };
  return obj;
}

export function deleteUrlVal(name, baseUrl = location.search) {
  const query = baseUrl.slice(1);
  if (query.indexOf(name)>-1) {
    const obj: any = {}
    const arr: any = query.split("&");
    for (var i = 0; i < arr.length; i++) {
      arr[i] = arr[i].split("=");
      obj[arr[i][0]] = arr[i][1];
    };
    Reflect.deleteProperty(obj, name);
    return '?' + JSON.stringify(obj).replace(/[\"\{\}]/g,"").replace(/\:/g,"=").replace(/\,/g,"&");
  };
}