import React, { FC, ReactNode, PropsWithChildren, CSSProperties, TransitionEventHandler, useRef, useState, useEffect, MouseEventHandler } from "react";
import classNames from "classnames";

import { useModalConetxt } from "@/context";
import ModalHeader from "./ModalHeader";

import css from "./Modal.less";


interface BackdropProps extends PropsWithChildren {
  onClick?: () => void;
}

const Backdrop: FC<BackdropProps> = ({ children, onClick }) => {
  const backdropRef = useRef(null);
  const hasMouseDown = useRef(false);
  const { isModalOpen, destroyModal } = useModalConetxt();
  const [cn, setCn] = useState(classNames(css.backdrop))

  const handleTransitionEnd: TransitionEventHandler<HTMLDivElement> = (event) => {
    if (!isModalOpen) {
      if (event.target === backdropRef.current) {
        destroyModal();
      }
    }
  }
  const handleClick: MouseEventHandler<HTMLDivElement> = (event) => {
    if (!onClick || event.target !== backdropRef.current || !hasMouseDown.current) {
      return;
    }
    onClick();
  }
  const handleMouseDown: MouseEventHandler<HTMLDivElement> = (event) => {
    if (event.target !== backdropRef.current) {
      return;
    }
    hasMouseDown.current = true;
  }

  useEffect(() => {
    if (isModalOpen) {
      setCn(classNames(cn, css.enter));
    } else {
      setCn(classNames(cn, css.leave));
    }
  }, [isModalOpen])

  return (
    <div
      ref={backdropRef}
      className={cn}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTransitionEnd={handleTransitionEnd}
    >
      {children}
    </div>
  )
}

interface ModalProps extends PropsWithChildren {
  title?: string | ReactNode;
  style?: CSSProperties;
  cancelOnClickOutside?: boolean;
  onCancel?: () => void;
}

const Modal: FC<ModalProps> = ({
  title,
  style,
  cancelOnClickOutside = false,
  children,
  onCancel
}) => {
  return (
    <Backdrop {...(cancelOnClickOutside && onCancel &&  { onClick: onCancel })}>
      <div className={css.container} style={style}>
        {title && <ModalHeader>{title}</ModalHeader>}
        {children}
      </div>
    </Backdrop>
  )
}

export default Modal;
