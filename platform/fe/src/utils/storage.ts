class PkgStorage {

  set (key, value, type = 'local') {
    let rst;

    if (type === 'local') {
      rst = localStorage.setItem(key, JSON.stringify(value));
    } else {
      rst = sessionStorage.setItem(key, JSON.stringify(value));
    }

    return rst;
  }

  get (key, type = 'local') {
    let rst;

    if (type === 'local') {
      rst = JSON.parse(localStorage.getItem(key) || 'null');
    } else {
      rst = JSON.parse(sessionStorage.getItem(key) || 'null');
    }

    return rst;
  }

  remove (key, type = 'local') {
    let rst;

    if (type === 'local') {
      rst = localStorage.removeItem(key);
    } else {
      rst = sessionStorage.removeItem(key);
    }

    return rst;
  }

  clear (type = 'local') {
    let rst;

    if (type === 'local') {
      rst = localStorage.clear();
    } else {
      rst = sessionStorage.clear();
    }

    return rst;
  }
}

export const storage = new PkgStorage();

export function setCookie(name, value, exdays) {
  const d = new Date()
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000))

  const expires = "expires=" + d.toGMTString()
  document.cookie = name + "=" + value + "; " + expires
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