
interface SseOption {
  onMessage?: (msg: string) => void,
  onError?: (err: Error) => void
}

export const sse = (url, params, {
  onMessage,
  onError,
}: SseOption) => {
  const urlObj = new URL(location.href)
  urlObj.pathname = url;
  Object.keys(params).forEach(key => {
    urlObj.searchParams.set(key, params[key])
  })
  
  const eventSource = new EventSource(urlObj.toString());
  
  // 监听消息事件
  eventSource.onmessage = function(event) {
    onMessage?.(event.data)
  };
  
  // 监听打开连接事件
  eventSource.onopen = function() {
  };
  
  // 监听错误事件
  eventSource.onerror = function(error) {
    console.log(error)
    eventSource.close();
    if (error?.data) {
      return onError?.(error?.data);
    }
  };
}

export const sseAppCommandExec = (params, opt: SseOption) => {
  sse('/paas/api/system/command/execInApp', params, opt)
}