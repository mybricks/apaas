export function uuid(length = 32): string {
  let text = "";

  const possible1 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const possible2 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    if(i === 0) {
      text += possible1.charAt(Math.floor(Math.random() * possible1.length));
    } else {
      text += possible2.charAt(Math.floor(Math.random() * possible2.length));
    }
  }

  return text;
}

export function isObject (obj: any): boolean {
  return Object.prototype.toString.call(obj) === '[object Object]';
}