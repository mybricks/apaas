/**
 * @description 通过摘要算法给不同的app签发token，加盐（私钥）确认是否当前服务端签发，属于当前服务端签发则可以请求，特殊地，如果私钥泄漏，可以替换私钥重新签发，以前签发的全部失效
 */

const crypto = require('crypto')

/**
 * @description 通过 hmac 的方式生成 accessToken
 * @param {*} payload 
 */
function getAccessToken({ appId }, secretKey) {
  const payloadEncoded = base64urlEncode(JSON.stringify({ appId }));
  const signature = crypto.createHmac('sha256', secretKey)
    .update(`${payloadEncoded}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return base64urlEncode(`${payloadEncoded}.${signature}`)
}


/**
 * @description 解析 accessToken
 * @param {*} accessToken 
 * @returns 
 */
function verifyAccessToken(token, secretKey) {
  const accessToken = base64urlDecode(token);
  const [payloadEncoded, signature] = accessToken.split('.');

  const expectedSignature = crypto.createHmac('sha256', secretKey)
    .update(`${payloadEncoded}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature !== expectedSignature) {
    throw new Error('不合法的token，请检查token是否正确');
  }

  const payload = JSON.parse(base64urlDecode(payloadEncoded));
  
  return { payload };
}

// Base64 编码
function base64urlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Base64 解码
function base64urlDecode(str) {
  str += new Array(5 - str.length % 4).join('=');
  return Buffer.from(str.replace(/\-/g, '+').replace(/_/g, '/'), 'base64').toString();
}

module.exports = {
  getAccessToken,
  verifyAccessToken,
}


