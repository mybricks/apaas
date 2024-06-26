import React, { FC, ReactNode, PropsWithChildren, CSSProperties } from "react";
import classNames from "classnames";

import { Icon } from "@/components/icon";
import { useAppRouterContext } from "@/context";

import css from "./MenuButton.less";

interface MenuButtonProps extends PropsWithChildren {
  icon: string | ReactNode;
  style?: CSSProperties;
  clickable?: boolean;
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
  children,
  clickable = true
}) => {
  const isactive = active || (search ? `?appId=${useAppRouterContext()}` === search : false);

  return (
    <button
      className={classNames(css.menuButton, { [css.clickable]: clickable, [css.active]: isactive }, className)}
      style={style}
      onClick={onClick}
    >
      {prefix && <span className={css.prefix}>{prefix}</span>}
      {icon && <span className={css.icon}><Icon icon={icon}/></span>}
      <span className={css.children}>
        {children}
      </span>
    </button>
  );
}

export default MenuButton;
