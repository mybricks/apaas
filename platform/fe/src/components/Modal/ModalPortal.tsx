import { FC, PropsWithChildren } from "react";
import { createPortal } from "react-dom";

let modalRoot;

function createModalRoot(): HTMLDivElement {
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'modal-root';
    document.body.appendChild(modalRoot);
    return modalRoot;
  }
  return modalRoot;
}

interface ModalPortalProps extends PropsWithChildren {}

const ModalPortal: FC<ModalPortalProps> = ({ children }) => {
  return createPortal(children, createModalRoot());
};

export default ModalPortal;
