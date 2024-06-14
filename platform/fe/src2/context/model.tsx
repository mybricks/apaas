import React, { FC, useContext, useState, useEffect, useRef, cloneElement, useMemo, createContext, PropsWithChildren } from "react";
import { createPortal } from "react-dom";

interface ModalContext {
  isModalOpen: boolean;
  showModal: <T extends ModalInjectedProps>(ModalComponent: React.FC<T>, props: Omit<T, 'hideModal'>) => void;
  hideModal: () => void;
  destroyModal: () => void;
}

export interface ModalInjectedProps {
  hideModal: () => void;
};

let modalRoot;

const modalContext = createContext<ModalContext>({} as ModalContext);

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

interface ModalProviderProps extends PropsWithChildren {

}

const ModalProvider: FC<ModalProviderProps> = ({ children }) => {
  // 设置弹窗组件
  const [modal, setModal] = useState<any>();
  // 弹窗是否打开
  const [isModalOpen, setIsModalOpen] = useState(false);

  const methods = useMemo(() => {
    const showModal: ModalContext["showModal"] = (ModalComponent, props) => {
      setModal([ModalComponent, props]);
      setIsModalOpen(true);
    }

    const hideModal = () => {
      setIsModalOpen(false);
    };

    const destroyModal = () => {
      setModal(null);
    }

    return {
      showModal,
      hideModal,
      destroyModal
    }
  }, [])

  const state = useMemo(() => {
    return {
      ...methods,
      isModalOpen
    }
  }, [isModalOpen])

  const [Modal, modalProps] = modal || [];

  return (
    <modalContext.Provider value={state}>
      {children}
      <ModalPortal>
        {Modal && <Modal hideModal={methods.hideModal} {...modalProps}/>}
      </ModalPortal>
    </modalContext.Provider>
  )
}

const useModalConetxt = () => {
  return useContext(modalContext);
}

export { ModalProvider, useModalConetxt };
