import React, { FC, PropsWithChildren } from "react";

import css from "./ModalHeader.less";

interface ModalHeaderProps extends PropsWithChildren {}

const ModalHeader: FC<ModalHeaderProps> = ({ children }) => {
  return (
    <div className={css.modalHeader}>
      {children}
    </div>
  )
}

export default ModalHeader;
