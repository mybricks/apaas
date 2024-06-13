import React, { ReactNode, PropsWithChildren } from "react";
import classNames from "classnames";

import { Icon } from "@/components/icon";

import css from "./index.less";

interface MenuButtonProps extends PropsWithChildren {
  icon: string | ReactNode;
  search?: string;
  locationSearch?: string;
  prefix?: ReactNode;
  onClick?: () => void;
}

export default function MenuButton({ icon, search, locationSearch, onClick, prefix, children }: MenuButtonProps) {
  return (
    <button
      className={classNames(css.menuButton, { [css.active]: search && search === locationSearch })}
      onClick={onClick}
    >
      {prefix}
      <Icon icon={icon}/>
      <span>
        {children}
      </span>
    </button>
  );
}
