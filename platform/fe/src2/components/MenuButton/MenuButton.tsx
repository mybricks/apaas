import React, { FC, ReactNode, PropsWithChildren, memo } from "react";
import classNames from "classnames";

import { Icon } from "@/components/icon";
import { useLocationConetxt } from "@/context";
import { LocationContext } from "@/types";

import css from "./MenuButton.less";

interface MenuButtonProps extends PropsWithChildren {
  icon: string | ReactNode;
  search?: string;
  prefix?: ReactNode;
  active?: boolean;
  onClick?: () => void;
}

const MenuButton: FC<MenuButtonProps> = memo(({
  icon,
  search,
  active,
  onClick,
  prefix,
  children
}) => {
  const isactive = active || (search ? useLocationConetxt().search === search : false);

  return (
    <button
      className={classNames(css.menuButton, { [css.active]: isactive })}
      onClick={onClick}
    >
      {prefix}
      <Icon icon={icon}/>
      <span>
        {children}
      </span>
    </button>
  );
})

export default MenuButton;
