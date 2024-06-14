import React, { FC, ReactNode, PropsWithChildren } from "react";
import classNames from "classnames";

import { LoadingPlaceholder } from "@/components";

import css from "./Button.less";

interface ButtonProps extends PropsWithChildren {
  loading?: boolean;
  className?: string;
  type?: "primary" | "secondary";
  size?: number;
  // icon?: ReactNode;
  contentWrapper?: (props: PropsWithChildren) => ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

const SIZE_MAP = {
  24: css.size24,
  32: css.size32,
  40: css.size40,
  48: css.size48
}

const Button: FC<ButtonProps> = ({
  loading,
  className,
  type = "secondary",
  size = 40,
  // icon,
  contentWrapper: ContentWrapper = DefaultContentWrapper,
  disabled,
  children,
  onClick
}) => {
  return (
    <button
      className={classNames(
        css.button,
        type === "primary" ? css.primary : css.secondary,
        SIZE_MAP[size],
        {
          [css.loading]: loading,
        },
        className
      )}
      disabled={loading || disabled}
      onClick={onClick}
    >
      {/* {icon && <IconWrapper>{icon}</IconWrapper>} */}
      <ContentWrapper>
        {children}
      </ContentWrapper>
      {loading && <LoadingWrapper primary={type === "primary"}/>}
    </button>
  )
}

function DefaultContentWrapper({ children }: PropsWithChildren) {
  return (
    <span className={css.contentWrapper}>
      {children}
    </span>
  )
}

// function IconWrapper({ children }: PropsWithChildren) {
//   return (
//     <span className={css.iconWrapper}>
//       {children}
//     </span>
//   )
// }

function LoadingWrapper({ primary }) {
  return (
    <div className={css.loadingWrapper}>
      <LoadingPlaceholder size={24} primary={primary}/>
    </div>
  )
}

export default Button;
