var { onFinished, onHeaders } = require('express-request-hook')
var timeConfig = require('../../timeout.json')
const timeout = function(time?, options?) {
  var opts = options || {}

  var delayConfig = Number(time || 10 * 1000)

  var respond = opts.respond === undefined || opts.respond === true

  return function (req, res, next) {
    const { _parsedUrl, method } = req;
    let delay = delayConfig
    const customConfigKey = Object.keys(timeConfig?.whiteList ?? {}).find(key => {
      const [path, curMethod] = key?.split(':') ?? [];

      return method === curMethod && new RegExp(path).test(_parsedUrl?.pathname ?? '');
    });
    const customConfig = timeConfig?.whiteList?.[customConfigKey];
    if(customConfig?.ignore === true) {
      next()
      return
    } else if(customConfig?.timeout) {
      delay = customConfig?.timeout
    }
    let id = setTimeout(function () {
      req.expired = true
      req.emit('timeout', delay)
    }, delay)

    if (respond) {
      req.on('timeout', () => {
        res.status(200).json({
          code: 10001,
          msg: '接口超时，请确认网络连接情况'
        })
      })
    }

    req.clearTimeout = function () {
      clearTimeout(id)
      id = null
    }
    req.expired = false

    onFinished(res, function () {
      clearTimeout(id)
    })

    onHeaders(res, function () {
      clearTimeout(id)
    })

    next()
  }
}

export { 
  timeout
}