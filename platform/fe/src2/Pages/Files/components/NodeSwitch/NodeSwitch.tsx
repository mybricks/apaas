import React, { FC, MouseEventHandler } from "react";
import classNames from "classnames";

import { Loading, CaretRight } from "@/components/icon";

import css from "./NodeSwitch.less";

interface NodeSwitchProps {
  loading: boolean;
  open: boolean;
  onClick: () => void;
}

const NodeSwitch: FC<NodeSwitchProps> = ({
  loading,
  open,
  onClick
}) => {
  const handleClick: MouseEventHandler<HTMLSpanElement> = (event) => {
    event.stopPropagation();
    onClick();
  }
  return (
    <span onClick={handleClick} className={classNames(css.nodeSwitch, {[css.open]: !loading && open})}>
      {loading ? 
        <Loading /> : 
        open ? <CaretRight /> : <CaretRight />
      }
    </span>
  )
}

export default NodeSwitch;
