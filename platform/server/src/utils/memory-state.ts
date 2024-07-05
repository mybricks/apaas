

/** 存储应用的加载状态，用于判断应用的挂载状态 */
class AppStatus {
  private appStatusMap = new Map()

  private ready = (namespace) => {
    if (!this.appStatusMap.has(namespace)) {
      this.appStatusMap.set(namespace, {})
      return
    }
  }

  get items () {
    const result = []
    this.appStatusMap.forEach((value, namespace) => {
      result.push({
        namespace,
        ...(value ?? {})
      })
    })
    return result
  }

  getStatus = (namespace) => {
    return this.appStatusMap.get(namespace) ?? {}
  }

  /** 设置前端挂载状态 */
  setFeStatus = (namespace, status: boolean, desc?) => {
    this.ready(namespace)

    this.appStatusMap.set(namespace, {
      ...this.appStatusMap.get(namespace), fe: {
        status,
        desc,
      }
    })
  }

  /** 设置服务端挂载状态 */
  setServerStatus = (namespace, status: boolean, desc?) => {
    this.ready(namespace)

    this.appStatusMap.set(namespace, {
      ...this.appStatusMap.get(namespace), server: {
        status,
        desc,
      }
    })
  }
}

export const MemoryState = {
  /** 存储应用的加载状态，用于判断应用的挂载状态 */
  appStatus: new AppStatus(),
}
