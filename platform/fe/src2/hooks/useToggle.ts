import { useState } from 'react';

/**
 * 使用React的useState钩子实现一个简单的切换开关功能。
 * @param {boolean} [initialValue=false] - 初始的开关状态，默认为false（关闭状态）。
 * @returns {Array<boolean, () => void>} - 返回一个数组，包含当前开关状态和一个用于切换状态的函数：
 *   - 第一个元素：当前开关是否开启（true表示开启，false表示关闭）
 *   - 第二个元素：一个无参数的函数，调用时会切换开关状态
 */
const useToggle = (initialValue: boolean = false): [boolean, () => void] => {
  const [isToggled, setIsToggled] = useState(initialValue);

  function toggle() {
    setIsToggled(!isToggled);
  }

  return [isToggled, toggle];
}

export default useToggle;
