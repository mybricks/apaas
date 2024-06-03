export function injectAjaxScript({ namespace }) {
  const placeholder = '_NAME_SPACE_'
  const rawStr = `
  var oldxhr=window.XMLHttpRequest
  function newobj(){}
  window.XMLHttpRequest=function(){
      let tagetobk=new newobj();
      tagetobk.oldxhr=new oldxhr();
      let handle={
          get: function(target, prop, receiver) {
              if(prop==='oldxhr'){
                  return Reflect.get(target,prop);
              }
              if(typeof Reflect.get(target.oldxhr,prop)==='function')
              {
                  if(Reflect.get(target.oldxhr,prop+'proxy')===undefined)
                  {
                      target.oldxhr[prop+'proxy']=function(...funcargs){
                          let newArgs = [...funcargs]
                          try {
                              if (["GET", "POST", 'PUT', 'DELETE', 'OPTIONS'].indexOf(newArgs[0]) !== -1) {
                                  if(newArgs[1].indexOf("http") !== 0) {
                                    const pathname = newArgs[1];
                                    let needProxy = false;
                                    ['.js', '.css', '.html'].forEach(function (item) {
                                        if(pathname.indexOf(item) !== -1) {
                                            needProxy = false
                                        }
                                    })
                                    if(pathname.startsWith('/paas/api') || pathname.startsWith('/api')) {
                                      needProxy = true
                                    }
                                    if(needProxy) {
                                        newArgs[1] = '${placeholder}' + newArgs[1]
                                    }
                                }
                              }
                          } catch (e) {}
                          let result=target.oldxhr[prop].call(target.oldxhr,...newArgs)
                          return result;
                      }
                  }
                  return Reflect.get(target.oldxhr,prop+'proxy')
              }
              if(prop) {
                if(prop.indexOf) {
                  if(prop.indexOf('response')!==-1) {
                    return Reflect.get(target.oldxhr,prop)
                  }
                }
              }
              return Reflect.get(target.oldxhr,prop);
          },
          set(target, prop, value) {
              return Reflect.set(target.oldxhr, prop, value);
          },
          has(target, key) {
              // debugger;
              return Reflect.has(target.oldxhr,key);
          }
      }
      let ret = new Proxy(tagetobk, handle);
      return ret;
  };
  `
  return rawStr.replace(placeholder, `/${namespace}`)
}

export function injectAppConfigScript(appConfig) {
  const rawStr = `
    try {
      _APP_CONFIG_;
    } catch(e) {
      window._APP_CONFIG_ = ${JSON.stringify(appConfig)}
    }
  `
  return rawStr
}

export function travelDom(domAst, { ajaxScriptStr, appConfigScriptStr, rawHtmlStr }) {
  let headTag = domAst.childNodes.find(node => node?.nodeName === 'html')?.childNodes?.[0];
  if(headTag.nodeName === 'head') {
    let ajaxNode = {
      nodeName: 'script',
      tagName: 'script',
      attrs: [],
      childNodes: [
        {
          nodeName: '#text',
          value: ajaxScriptStr
        }
      ],
      parentNode: headTag
    }
    let appConfigNode = {
      nodeName: 'script',
      tagName: 'script',
      attrs: [],
      childNodes: [
        {
          nodeName: '#text',
          value: appConfigScriptStr
        }
      ],
      parentNode: headTag
    }
    headTag.childNodes.push(ajaxNode)
    if(rawHtmlStr?.indexOf('_APP_CONFIG_') === -1) {
      headTag.childNodes.unshift(appConfigNode)
    }
  }
}
