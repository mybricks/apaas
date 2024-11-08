

class Debugger {
  private _pending = false
  private _ignoreWait = false
  private _waitCount = 0
  // 断点 unshift 入 pop 出
  private _waitBreakpointIds: any = []
  // 下一步
  private _waitIdToResolvesMap: any = {}

  hasBreakpoint(connection: any) {
    return !this._ignoreWait && (this._pending || connection.isBreakpoint)
  }

  private open() {

  }

  private close() {

  }

  wait(connection: any, cb: any) {
    return new Promise((resolve: any) => {
      if (this._ignoreWait) {
        resolve()
      } else {
        const waiting = this._waitBreakpointIds.length > 0

        if (!waiting) {
          cb()
        }

        this.open()
        this._pending = true;
        if (connection.isBreakpoint) {
          if (waiting) {
            const lastId = this._waitBreakpointIds[0]
            this._waitIdToResolvesMap[lastId].push(cb)
          }
          const id = (this._waitCount ++) + connection.id
          this._waitBreakpointIds.unshift(id)
          this._waitIdToResolvesMap[id] = [resolve]
        } else {
          const id = this._waitBreakpointIds[0]
          this._waitIdToResolvesMap[id].push(resolve)
        }
      }
    })
  }

  next(nextAll = false) {
    if (nextAll) {
      while (this._waitBreakpointIds.length) {
        this.next()
      }
    } else {
      const id = this._waitBreakpointIds.pop()
      const resolves = this._waitIdToResolvesMap[id]
      if (resolves) {
        resolves.forEach((resolve: any) => resolve())
      }
      if (!this._waitBreakpointIds.length) {
        this._pending = false
        this.close()
      }
    }
  }

  setIgnoreWait(bool: boolean) {
    this._ignoreWait = bool
  }
}


class DebugPoolManager {
  debugMap = new Map<string, {
    debugger: Debugger,
    lastVisitTime: number,
  }>()

  createDebugger = (scopeId: string, serviceId: string) => {
    const _debugger = new Debugger();
    this.debugMap.set(`${scopeId}@${serviceId}`, {
      debugger: _debugger,
      lastVisitTime: Date.now(),
    })
    return _debugger
  }

  getDebugger = (scopeId: string, serviceId: string) => {
    const debuggerItem = this.debugMap.get(`${scopeId}@${serviceId}`)
    if (debuggerItem) {
      this.debugMap.set(`${scopeId}@${serviceId}`, { ...debuggerItem, lastVisitTime: Date.now() })
      return debuggerItem
    }
    return
  }
}

export const debugPoolManager = new DebugPoolManager()