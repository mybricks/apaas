import React, {
  useRef,
  useMemo,
  useEffect,
  useCallback,
  useLayoutEffect
} from 'react'

import {message} from 'antd'
import {useComputed, useObservable} from '@mybricks/rxui'

import {appCtx} from '..'
import {Item} from '../..'
import ItemList from './itemList'
import NavSwitch from './navSwitch'
import {getUrlQuery} from '../../../../utils'

export type Child = {[key: string]: {
  open: boolean;
  child: Child;
}}
export interface MenuCtx {
  open: boolean;
  loading: boolean;
  items: Array<any>;
  switchOnly: boolean;
  getFiles: (...args: any) => Promise<any>;
  onClick: (...args: any) => void;
  canDrag: boolean;
}

interface Props {
  id: string | null;
  canDrag?: (args: any) => boolean;
  namespace?: string;
  icon: JSX.Element | string | ((...args: any) => JSX.Element);
  name: string;
  child?: {open: boolean, child: Child};
  level?: number;
  focusable?: boolean;
  switchOnly?: boolean;
  CustomList?: ({menuCtx, child}: {menuCtx: MenuCtx, child: Child}) => JSX.Element;
  getFiles: (...args: any) => Promise<any>;
  onClick: (...args) => void;
  suffix?: React.ReactNode
  info?: any
}

/**
 * 
 * @param {Object} props 
 * @param {Object} props.id              唯一值
 * @param {string} props.name            名称
 * @param {string} props.icon            图标
 * @param {boolean} props.child          子节点是否展开
 * @param {boolean} props.level          层级
 * @param {boolean} props.focusable      可被点中
 * @param {boolean} props.switchOnly     仅最为开关
 * @param {JSX.Element} props.CustomList 自定义列表
 * @returns 
 */
export default function NavMenu ({
  id,
  icon,
  name,
  child,
  level = 1,
  namespace,
  canDrag = () => false,
  focusable = true,
  switchOnly = false,
  CustomList,
  getFiles,
  onClick,
  suffix,
  info = {}
}: Props): JSX.Element {
  const menuCtx: MenuCtx = useObservable({
    id,
    open: child?.open || false,
    loading: false,
    items: [],
    switchOnly,
    getFiles,
    onClick,
    canDrag: canDrag(id)
  });

  useMemo(() => {
    if (!child) return;

    if (menuCtx.open) {
      // 默认是展开话，设置loading为true，拉子节点
      menuCtx.loading = true;
    }
  }, []);

  useEffect(() => {
    if (namespace) {
      appCtx.sidebarInfo[namespace] = menuCtx
    }
    return () => {
      if (namespace) {
        Reflect.deleteProperty(appCtx.sidebarInfo, namespace)
      }
    }
  }, [])

  const Switch: JSX.Element = useMemo(() => {
    return !child ? (<></>) : (
      <NavSwitch
        id={id}
        child={child}
        menuCtx={menuCtx}
      />
    );
  }, []);

  const List: JSX.Element = useMemo(() => {
    return !child ? (<></>) : (
      <RenderList id={id} CustomList={CustomList} level={level} child={child} menuCtx={menuCtx} canDrag={canDrag} />
    );
  }, []);

  const navClick: () => void = useCallback(() => {
    if (focusable) {
      onClick(id);
    }

    if (!child) return;

    if (!menuCtx.open && !switchOnly) {
      menuCtx.loading = true;
    } else {
      menuCtx.open = true;
      child.open = true;
    }
  }, []);

  const RenderItem = useMemo(() => {
    let jsx = (
      <Item
        prefix={Switch}
        suffix={suffix}
        icon={icon}
        title={name}
        namespace={namespace}
        onClick={navClick}
        focusable={focusable}
        onDragEnter={(e) => e.preventDefault()}
      />
    )
    if (menuCtx.canDrag) {
      return (
        <DragFile item={info} canDrag={true}>
          {jsx}
        </DragFile>
      )
    }
    return jsx
  }, [name, icon])

  return (
    <>
      {RenderItem}
      {List}
    </>
  );
}

function RenderList ({id, CustomList, level, child, menuCtx, canDrag}): JSX.Element {
  return useComputed(() => {
    if (menuCtx.open) {
      return (
        <div style={{marginLeft: level * 28}}>
          {CustomList ? <CustomList menuCtx={menuCtx} child={child.child} /> : <ItemList id={id} child={child.child} menuCtx={menuCtx} canDrag={canDrag} />}
        </div>
      );
    }

    return <></>;
  });
}

const folderExtNameMap = {
  'folder': true,
  'folder-module': true,
  'folder-project': true
}

let notMoveIdMap = {}

function onDragStart (event, dom, item) {
  if (!item.extName) {
    event.preventDefault()
  } else {
    appCtx.setDragItem({item, dom})
  }
}

function onDragOver (event, dom, item) {
  event.preventDefault()
  const { dragItem: {
    item: dragItem
  } } = appCtx
  
  if (canDrop(dragItem, item)) {
    event.dataTransfer.dropEffect = 'copy'
    const domStyle = dom.children[0].style
    domStyle.outline = '2px solid #fa6400'
    domStyle.outlineOffset = '-2px'
  } else {
    event.dataTransfer.dropEffect = 'none'
  }
}

function onDragLeave (event, dom, item) {
  const { dragItem: {
    item: dragItem
  } } = appCtx
  if (canDrop(dragItem, item)) {
    const domStyle = dom.children[0].style
    domStyle.outline = 'none'
    domStyle.outlineOffset = '0'
  }
}

function onDragEnd (event, dom, item) {
  appCtx.setDragItem(null)
  notMoveIdMap = {}
}

function onDrop (event, dom, item) {
  const { 
    item: dragItem,
    dom: dragDom
   } = appCtx.dragItem

  dragDom.style.opacity = 0.5
  dragDom.draggable = false

  const msgKey = `move-${new Date().getTime()}`

  message.loading({
    content: '移动中...',
    key: msgKey,
    duration: 0
  })

  const domStyle = dom.children[0].style
  domStyle.outline = 'none'
  domStyle.outlineOffset = '0'

  appCtx.fileMove(item, dragItem, [async () => await appCtx.getAll(getUrlQuery())]).then((r) => {
    message.destroy(msgKey)
    message.success(r)
  }).catch((e) => {
    message.destroy(msgKey)
    message.warn(e)
    dragDom.style.opacity = 1
    dragDom.draggable = true
  })
}

function canDrop(move, to) {
  let canDrop = false

  const toGroup = !to.extName

  if (toGroup) {
    if (!move.parentId) {
      if (move.groupId === to.id) {

      } else {
        canDrop = true
      }
    } else {
      canDrop = true
    }
  } else {
    if (folderExtNameMap[to.extName]) {
      if (move.parentId === to.id || move.id === to.id || to.parentId === move.id || notMoveIdMap[to.parentId]) {
        if (to.parentId === move.id) {
          notMoveIdMap[to.id] = true
        }
      } else {
        canDrop = true
      }
    }
  }

  return canDrop
}

function DragFile ({item, canDrag, children}) {
  const ref = useRef<HTMLDivElement>(null)

  // useUpdateEffect(() => {
  //   const { dragItem } = appCtx
  //   if (dragItem) {
  //     if (canDrop(dragItem.item, item)) {
  //       const domStyle = (ref.current.children[0] as HTMLDivElement).style
  //       domStyle.outline = '1px dashed #fa6400'
  //       domStyle.outlineOffset = '-2px'
  //     }
  //   } else {
  //     const { extName } = item
  //     if (!extName || folderExtNameMap[extName]) {
  //       const domStyle = (ref.current.children[0] as HTMLDivElement).style
  //       domStyle.outline = 'none'
  //       domStyle.outlineOffset = '0'
  //     }
  //   }
  // }, [appCtx.dragItem])

  useLayoutEffect(() => {
    const { current } = ref
    if (canDrag) {
      current.draggable = canDrag
      current.addEventListener('dragstart', (event) => {
        onDragStart(event, current, item)
      })
      current.addEventListener('dragover', (event) => {
        onDragOver(event, current, item)
      })
      current.addEventListener('dragleave', (event) => {
        onDragLeave(event, current, item)
      })
      current.addEventListener('dragend', (event) => {
        onDragEnd(event, current, item)
      })
      current.addEventListener('drop', (event) => {
        onDrop(event, current, item)
      })
    }
   
  }, [])

  return (
    <div ref={ref}>
      {children}
    </div>
  )
}
