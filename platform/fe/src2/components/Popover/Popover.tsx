import React, { FC } from "react";
import { Popover as Popover$1, PopoverProps } from "antd";
import classNames from "classnames";

import css from "./Popover.less";

const Popover: FC<PopoverProps> = (props) => {
  return (
    <Popover$1 {...props} overlayClassName={classNames(css.popover, props.overlayClassName)}/>
  );
}

export default Popover;
