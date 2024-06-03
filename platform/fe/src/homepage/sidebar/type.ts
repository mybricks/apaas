import {Props as PanelItemProps} from '../hooks/usePanelItem'

/** 菜单项组件入参 */
interface ItemProps {
  /** 图标 */
  icon: JSX.Element | string | ((...args: any) => JSX.Element);
  /** 名称 */
  title: JSX.Element | string;
  /** 唯一标识，用于决定是否能够展现选中状态 */
  namespace?: string;
  /** 自定义点击事件 */
  onClick?: () => void;
  /** 弹窗/抽屉/... */
  modal?: PanelItemProps;

  prefix?: React.ReactNode;

  suffix?: React.ReactNode;

  focusable?: boolean;

  onDragEnter?: (e: any) => void;
}

interface ModalProps extends PanelItemProps {
  itemContext: {
    onClick: Function;
  }
}


export {
  ModalProps,
  ItemProps
}