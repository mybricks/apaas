import {
  useRef,
  useEffect,
  EffectCallback,
  DependencyList
} from 'react'

export function useUpdateEffect(fn: EffectCallback, deps: DependencyList = []): void {
  if (!Array.isArray(deps) || !deps.length) return

  const isInit = useRef<boolean>(false)

  useEffect(() => {
    if (isInit.current) {
      fn()
    } else {
      isInit.current = true
    }
  }, deps)
}
