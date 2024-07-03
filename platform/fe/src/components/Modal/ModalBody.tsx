import React, { FC, PropsWithChildren, CSSProperties } from "react";
import classNames from "classnames";

import css from "./ModalBody.less";

interface ModalBodyProps extends PropsWithChildren {
  className?: string;
  style?: CSSProperties;
}

const ModalBody: FC<ModalBodyProps> = ({
  children,
  className,
  style
}) => {
  return (
    <div
      className={classNames(css.modalBody, className)}
      style={style}
    >{children}</div>
  )
}

export default ModalBody;
