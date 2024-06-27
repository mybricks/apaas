import React, { FC, PropsWithChildren } from "react";

import css from "./ModalBody.less";

interface ModalBodyProps extends PropsWithChildren {}

const ModalBody: FC<ModalBodyProps> = ({ children }) => {
  return (
    <div className={css.modalBody}>{children}</div>
  )
}

export default ModalBody;
