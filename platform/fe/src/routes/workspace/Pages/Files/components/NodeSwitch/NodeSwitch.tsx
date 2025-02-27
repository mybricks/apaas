import React, { FC, MouseEventHandler } from "react";
import classNames from "classnames";

import { CaretRight } from "@workspace/components/icon";

import css from "./NodeSwitch.less";

interface NodeSwitchProps {
  open: boolean;
  onClick: () => void;
}

const NodeSwitch: FC<NodeSwitchProps> = ({
  open,
  onClick
}) => {
  const handleClick: MouseEventHandler<HTMLSpanElement> = (event) => {
    event.stopPropagation();
    onClick();
  }
  return (
    <span onClick={handleClick} className={classNames(css.nodeSwitch, {[css.open]: open})}>
      {open ? <CaretRight /> : <CaretRight />}
    </span>
  )
}

export default NodeSwitch;
