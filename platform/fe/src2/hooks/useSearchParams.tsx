import { useSearchParams as useSearchParams$1 } from "react-router-dom";

const useSearchParams = (paramsKeys: string[]) => {
  const [searchParams] = useSearchParams$1();
  const params = paramsKeys.reduce((pre, cur) => {
    pre[cur] = searchParams.get(cur);
    return pre;
  }, {}) as { [P in typeof paramsKeys[number]]: string };

  return params;
}

export default useSearchParams;
