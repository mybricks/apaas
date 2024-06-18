import React, { FC, ReactNode, PropsWithChildren, CSSProperties } from "react";
import classNames from "classnames";

import { Icon } from "@/components/icon";
import { useLocationConetxt } from "@/context";
import { LocationContext } from "@/types";

import css from "./MenuButton.less";

interface MenuButtonProps extends PropsWithChildren {
  icon: string | ReactNode;
  style: CSSProperties;
  className?: string;
  search?: string;
  prefix?: ReactNode;
  active?: boolean;
  onClick?: () => void;
}

const MenuButton: FC<MenuButtonProps> = ({
  icon,
  style,
  className,
  search,
  active,
  onClick,
  prefix,
  children
}) => {
  const isactive = active || (search ? useLocationConetxt().search === search : false);

  return (
    <button
      className={classNames(css.menuButton, className, { [css.active]: isactive })}
      style={style}
      onClick={onClick}
    >
      {prefix}
      {icon && <span className={css.icon}><Icon icon={icon}/></span>}
      <span>
        {children}
      </span>
    </button>
  );
}

export default MenuButton;
