import React, { FC, ReactNode, PropsWithChildren } from "react";
import classNames from "classnames";

import { Icon } from "@/components/icon";
import { useLocationConetxt } from "@/context";
import { LocationContext } from "@/types";

import css from "./MenuButton.less";

interface MenuButtonProps extends PropsWithChildren {
  icon: string | ReactNode;
  search?: string;
  prefix?: ReactNode;
  onClick?: () => void;
}

const MenuButton: FC<MenuButtonProps> = ({ icon, search, onClick, prefix, children }) => {
  const { search: locationSearch } = search ? useLocationConetxt() : {} as LocationContext;

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

export default MenuButton;
