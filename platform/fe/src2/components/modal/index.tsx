import React, { forwardRef, PropsWithChildren, useEffect, useLayoutEffect, useState, ReactNode, useRef } from "react";
import { createPortal } from "react-dom";
import classNames from "classnames";

import { render as renderReact, unmount as unmountReact } from "@/utils/render";
import { Button } from "@/components";

import css from "./index.less";

let root: HTMLDivElement;

// TODO: 区分销毁和非销毁
interface ModalProps extends ConfirmProps {
  open: boolean;
  children: ReactNode;
  afterClose?: () => void;
  // destroyOnClose?: boolean;
}

export default function Modal(props: ModalProps) {
  const { open, children, title, onOk, onCancel, afterClose, ...confirmProps } = props;
  const [shouldRender, setShouldRender] = useState(open);
  // const ref = useRef(false);
  // if (!ref.current && !open) {
  //   return null;
  // }
  const handleOnOk = () => {
    
  }

  const handleOnCancel = () => {

  }

  const onAnimationEnd = () => {
    if (!open) {
      setShouldRender(false);
      afterClose?.();
    }
  }

  useEffect(() => {
    if (open) {
      setShouldRender(true);
    }
  }, [open])

  return shouldRender && createPortal(
    <ConfirmWrap
      open={open}
      title={title}
      content={children}
      onCancel={onCancel}
      onOk={onOk}
      onAnimationEnd={onAnimationEnd}
      {...confirmProps}
    />,
    createRoot()
  );
}

interface ConfirmProps {
  title: string | ReactNode;
  content?: string | ReactNode;
  width?: number;
  okText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
  confirmDisabled?: boolean;
  onOk?: () => void | Promise<any>;
  onCancel?: () => void;
}

Modal.confirm = (props: ConfirmProps) => {
  const root = createRoot();
  const { onOk, onCancel, ...other } = props;
  let currentProps = { ...other, open: true };

  const handleOnOk = () => {
    const okResponse = onOk?.();

    if (okResponse instanceof Promise) {
      currentProps = { ...currentProps, confirmLoading: true };
      render();
      okResponse.then(() => {
        close();
      }).catch(() => {
        currentProps = { ...currentProps, confirmLoading: false };
        render();
      })
    } else {
      close();
    }
  }

  const handleOnCancel = () => {
    onCancel?.();
    close();
  }

  const render = () => {
    renderReact(
      <ConfirmWrap
        {...currentProps}
        onCancel={handleOnCancel}
        onOk={handleOnOk}
        onAnimationEnd={onAnimationEnd}
      />
    , root);
  }

  const onAnimationEnd = () => {
    if (!currentProps.open) {
      unmountReact(root);
    }
  }

  const close = () => {
    currentProps = { ...currentProps, open: false };
    render();
  }

  render();

  return {
    close
  }
}

interface ConfirmWrapProps extends ConfirmProps {
  open: boolean;
  onAnimationEnd?: () => void;
}

function ConfirmWrap({
  title,
  content,
  width = 512,
  open,
  okText = "确 认",
  cancelText = "取 消",
  confirmLoading,
  confirmDisabled,
  onCancel,
  onOk,
  onAnimationEnd
}: ConfirmWrapProps) {
  return (
    <div
      className={classNames(css.mask, {[css.maskEnter]: open, [css.maskLeave]: !open})}
      onAnimationEnd={() => !open && onAnimationEnd?.()}
    >
      <div
        className={classNames(css.wrap, {[css.wrapEnter]: open, [css.wrapLeave]: !open})}
        style={{ width }}
      >
        <div className={css.title}>
          {title}
        </div>
        <div className={css.content}>
          {content}
        </div>
        <div className={css.footer}>
          <div className={css.actions}>
            <Button onClick={() => onCancel?.()}>
              {cancelText}
            </Button>
            <Button
              type="primary"
              loading={confirmLoading}
              disabled={confirmDisabled}
              onClick={() => onOk?.()}
            >
              {okText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function createRoot(): HTMLDivElement {
  if (!root) {
    root = document.createElement('div');
    root.id = 'modal-root';
    document.body.appendChild(root);
    return root;
  }
  return root;
}
