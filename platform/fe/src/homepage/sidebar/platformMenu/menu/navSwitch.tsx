import React, {useCallback} from 'react'

import {useComputed, useObservable} from '@mybricks/rxui'
import {LoadingOutlined, CaretRightOutlined} from '@ant-design/icons'

import {Child, MenuCtx} from './navMenu'

import css from './navSwitch.less'

// const log = console.log
// console.log = (v, ...other) => {
//   try {
//     const relV = JSON.parse(JSON.stringify(v))
//     log(relV, ...other)
//   } catch (e) {
//     log(v, ...other)
//   }
// }

interface Props {
  id: string | null;
  child: {open: boolean, child: Child};
  menuCtx: MenuCtx;
}

/**
 * 
 * @param {Object} param0 
 * @param {string} param0.id       id
 * @param {string} param0.child    子节点
 * @param {boolean} param0.menuCtx 上下文
 * @returns 
 */
export default function NavSwitch ({id, child, menuCtx}: Props): JSX.Element {
  const switchCtx = useObservable({
    isLoading: false
  });
  
  useComputed(() => {
    if (menuCtx.loading && !menuCtx.switchOnly && !switchCtx.isLoading) {
      switchCtx.isLoading = true;

      menuCtx.getFiles(id).then((files) => {
        menuCtx.items = files;
        menuCtx.open = true;
      }).finally(() => {
        menuCtx.loading = false;
        switchCtx.isLoading = false;
      });

      // GlobalMethod.getFiles({extName: 'folder'})
      // appContext.getFiles(id, 'folder').then(rst => {
      //   menuCtx.items = rst.files;
      //   menuCtx.open = true;
      // }).catch(e => {
      //   console.log(e, '获取nav文件夹列表');
      // }).finally(() => {
      //   menuCtx.loading = false;
      //   switchCtx.isLoading = false;
      // });
    }
  });

  useComputed(() => {
    const { open } = menuCtx;
    if (child.open !== open) {
      child.open = open;
    }
  });

  const onClick: (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => void = useCallback((e) => {
    e.stopPropagation();

    if (menuCtx.open) {
      menuCtx.open = false;
    } else {
      if (!menuCtx.switchOnly) {
        menuCtx.loading = true;
      } else {
        menuCtx.open = true;
      }
    }
  }, []);
  
  const Switch: JSX.Element = useComputed(() => { 
    return (
      <div className={css.container} onClick={onClick}>
        {/* @ts-ignore */}
        {menuCtx.loading ? <LoadingOutlined /> : <CaretRightOutlined className={`${menuCtx.open ? css.open : ''}`}/>}
      </div>
    );
  });

  return Switch;
}
