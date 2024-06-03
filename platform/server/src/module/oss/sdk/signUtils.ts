
import * as crypto from 'crypto'

function lowercaseKeyHeader(headers) {
  const lowercaseHeader = {};
  if (headers) {
      Object.keys(headers).forEach(key => {
          lowercaseHeader[key.toLowerCase()] = headers[key];
      });
  }
  return lowercaseHeader;
}

/**
 *
 * @param {String} resourcePath
 * @param {Object} parameters
 * @return
 */
exports.buildCanonicalizedResource = function buildCanonicalizedResource(resourcePath, parameters) {
  let canonicalizedResource = `${resourcePath}`;
  let separatorString = '?';

  if (typeof parameters === 'string' && parameters.trim() !== '') {
    canonicalizedResource += separatorString + parameters;
  } else if (Array.isArray(parameters)) {
    parameters.sort();
    canonicalizedResource += separatorString + parameters.join('&');
  } else if (parameters) {
    const compareFunc = (entry1, entry2) => {
      if (entry1[0] > entry2[0]) {
        return 1;
      } else if (entry1[0] < entry2[0]) {
        return -1;
      }
      return 0;
    };
    const processFunc = key => {
      canonicalizedResource += separatorString + key;
      if (parameters[key] || parameters[key] === 0) {
        canonicalizedResource += `=${parameters[key]}`;
      }
      separatorString = '&';
    };
    Object.keys(parameters).sort(compareFunc).forEach(processFunc);
  }

  return canonicalizedResource;
};

exports.buildCanonicalString = function canonicalString(method, resourcePath, request, expires) {
  request = request || {};
  const headers = lowercaseKeyHeader(request.headers);
  const OSS_PREFIX = 'x-oss-';
  const ossHeaders = [];
  const headersToSign = {};

  let signContent = [
    method.toUpperCase(),
    headers['content-md5'] || '',
    headers['content-type'],
    expires || headers['x-oss-date']
  ];

  Object.keys(headers).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.indexOf(OSS_PREFIX) === 0) {
      headersToSign[lowerKey] = String(headers[key]).trim();
    }
  });

  Object.keys(headersToSign)
    .sort()
    .forEach(key => {
      ossHeaders.push(`${key}:${headersToSign[key]}`);
    });

  signContent = signContent.concat(ossHeaders);

  signContent.push(this.buildCanonicalizedResource(resourcePath, request.parameters));

  return signContent.join('\n');
};


/**
 * @param {String} accessKeySecret
 * @param {String} canonicalString
 */
exports.computeSignature = function computeSignature(accessKeySecret, canonicalString, headerEncoding = 'utf-8') {
  const signature = crypto.createHmac('sha1', accessKeySecret);
  // @ts-ignore
  return signature.update(Buffer.from(canonicalString, headerEncoding)).digest('base64');
};

/**
 * @param {String} accessKeyId
 * @param {String} accessKeySecret
 * @param {String} canonicalString
 */
exports.authorization = function authorization(accessKeyId, accessKeySecret, canonicalString, headerEncoding) {
  return `OSS ${accessKeyId}:${this.computeSignature(accessKeySecret, canonicalString, headerEncoding)}`;
};