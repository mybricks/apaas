import React, { FC } from "react";
import { Popover, PopoverProps } from "antd";
import classNames from "classnames";

import css from "./Popover.less";

const Popover2: FC<PopoverProps> = (props) => {
  return (
    <Popover {...props} overlayClassName={classNames(css.popover, props.overlayClassName)}/>
  );
}

export default Popover2;
