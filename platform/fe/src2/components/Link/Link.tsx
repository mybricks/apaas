import React, { FC } from "react";
import { Link as Link$1, LinkProps } from "react-router-dom";
import classNames from "classnames";

import css from "./Link.less";

const Link: FC<LinkProps> = ({
  className,
  ...props
}) => {
  return <Link$1 className={classNames(css.link, className)} {...props}/>
}

export default Link;
