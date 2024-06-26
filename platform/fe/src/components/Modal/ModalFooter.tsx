import React, { FC, PropsWithChildren } from "react";

import css from "./ModalFooter.less";

interface ModalFooterProps extends PropsWithChildren {}

const ModalFooter: FC<ModalFooterProps> = ({ children }) => {
  return (
    <div className={css.modalFooter}>
      {children}
    </div>
  )
}

export default ModalFooter;
