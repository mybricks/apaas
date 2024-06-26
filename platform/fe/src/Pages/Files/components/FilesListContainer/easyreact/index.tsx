import { useState } from 'react'

export function easyreact(fn) {
  return function (props) {
    const [, setState] = useState(0);

    const [finalFn] = useState(() => {
      const observable = (initState) => {
        return new Proxy(initState, {
          get: (target, key) => {
            return Reflect.get(target, key)
          },
          set: (target, key, value) => {
            Reflect.set(target, key, value)
            setState((count) => count+1)
            return true
          }
        })
      }

      return fn({ observable });
    });

    return finalFn(props);
  }
}
