import React from "react";
import { Popover, PopoverProps } from "antd";
import classNames from "classnames";

import css from "./index.less";

export default function Popover2(props: PopoverProps) {
  return (
    <Popover {...props} overlayClassName={classNames(css.popover, props.overlayClassName)}/>
  );
}
