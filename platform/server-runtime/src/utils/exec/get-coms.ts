import * as vm from 'vm';
import * as fse from 'fs-extra'
import * as path from 'path'

const DEFAULT_COMLIB = path.resolve(__dirname, './../../comlibs/rt.js');
  

const getComponentsMapFromComlibs = (comlibs) => {
  let componentsMap = {}

  function getComsFromComAry(com) {
    if (Array.isArray(com.comAray)) {
      com.comAray.forEach(com => {
        if (com.namespace && com.version) {
          componentsMap[`${com.namespace}@${com.version}`] = {
            namespace: com.namespace,
            version: com.version,
            runtime: com.runtime,
          }
        }
      })
    }
  }

  if (Array.isArray(comlibs)) {
    comlibs.forEach(comlib => {
      getComsFromComAry(comlib)
    })
  }

  return componentsMap
}

const getComponentsMapFromRtJsContent = (scriptContent: string) => {
  const sandBoxContext = {
    global: {
      __comlibs_rt_: []
    },
    console,
    eval,
    module,
    exports,
  }
  vm.createContext(sandBoxContext);
  const script = new vm.Script(scriptContent);
  script.runInContext(sandBoxContext);

  const comlibs = sandBoxContext.global.__comlibs_rt_;
  // 触发 GC
  sandBoxContext.global.__comlibs_rt_ = null

  return getComponentsMapFromComlibs(comlibs ?? [])
}

// TODO，优化成带缓存的，不用每一次都重新加载
export const getComponentsMap = async (scriptContent?: string) => {
  return Object.assign(getComponentsMapFromRtJsContent(fse.readFileSync(DEFAULT_COMLIB, 'utf-8')), getComponentsMapFromRtJsContent(scriptContent))
}

export const getComDef = ({ namespace, version }) => {
  
}