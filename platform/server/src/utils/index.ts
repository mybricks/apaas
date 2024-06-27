import * as moment from "dayjs";
const crypto = require('crypto');
const os = require('os');

import { Logger } from '@mybricks/rocker-commons'

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

export const Logs = {
  info(content: string) {
    Logger.info(
      `[Mybricks] - ${moment(new Date()).format(
        "YYYY-MM-DD HH:mm:ss"
      )} ${content}`
    );
  },
};

/** 生成验证码 */
export function uuidOfNumber(length = 6): string {
  let text = '';

  const possible = '0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

/** parse JSON string，同时 catch 错误 */
export const safeParse = (content: string, defaultValue = {}) => {
  try {
    return JSON.parse(content);
  } catch {
    return defaultValue;
  }
};

/** 编码 */
export const safeEncodeURIComponent = (content: string) => {
  try {
    return encodeURIComponent(content);
  } catch {
    return content ?? "";
  }
};

/** 解码 */
export const safeDecodeURIComponent = (content: string) => {
  try {
    return decodeURIComponent(content);
  } catch {
    return content ?? "";
  }
};

export function getNextVersion(version, max = 100) {
  if (!version) return "1.0.0";
  const vAry: any[] = version.split(".");
  let carry: boolean = false;
  const isMaster = vAry.length === 3;
  if (!isMaster) {
    max = -1;
  }

  for (let i = vAry.length - 1; i >= 0; i--) {
    const res: number = Number(vAry[i]) + 1;
    if (i === 0) {
      vAry[i] = res;
    } else {
      if (res === max) {
        vAry[i] = 0;
        carry = true;
      } else {
        vAry[i] = res;
        carry = false;
      }
    }
    if (!carry) break;
  }

  return vAry.join(".");
}

export function getRealHostName(requestHeaders) {
  let hostName = requestHeaders.host
  if(requestHeaders['x-forwarded-host']) {
    hostName = requestHeaders['x-forwarded-host']
  } else if(requestHeaders['x-host']) {
    hostName = requestHeaders['x-host'].replace(':443', '')
  }
  return hostName
}

export function getRealDomain(request) {
  if (!request) { return ''; }
  const { origin } = request.headers
  if (origin) return origin
  let hostName = getRealHostName(request.headers);
  // let protocol = request.headers['x-scheme'] ? 'https' : 'http'
	/** TODO: 暂时写死 https */
  // let protocol = 'https';
  let protocol = request.headers?.['connection'].toLowerCase() === 'upgrade' ? 'https' : 'http'
  let domain = `${protocol}:\/\/${hostName}`
  return domain
}

export * from './type'

export * from './snow-flake'

export function getOSInfo() {
  return {
    arch: os.arch(), // 获取操作系统的位数，如32位或64位
    type: os.type(), // 获取操作系统类型，如Linux或Windows_NT
    release: os.release(), // 获取操作系统版本，如6.1.7601
    hostname: os.hostname() // 获取主机名，如localhost
  }
}

export function getPlatformFingerPrint() {
  const { arch, type, release, hostname } = getOSInfo();
  var serverInfo = arch + type + release + hostname;
  var hash = crypto.createHash('md5').update(serverInfo).digest('hex');
  return hash;
}

export function isObject (obj: any): boolean {
  return Object.prototype.toString.call(obj) === '[object Object]';
}


export function pick(obj: any, keys: string[]) {
  const result = {};
  if (isObject(obj)) {
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
  }
  return result;
}

/**
 * 转义文件名中的特殊字符，仅保留字母、数字、下划线和中划线
 * @param {string} fileName 原始文件名
 * @return {string} 转义后的文件名
 */
export function escapeFileName(fileName: string): string {
  // 使用正则表达式保留字母、数字、下划线和中划线，其他字符替换为下划线
  return fileName.replace(/[^\w\-]/g, '_');
}