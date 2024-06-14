import React, { FC } from "react";
import classNames from "classnames";

import css from "./NavbarSection.less";

interface NavbarSection {
  value: string;
  options: {
    label: string;
    value: string;
  }[];
  onChange?: (value: string) => void;
}

const NavbarSection: FC<NavbarSection> = ({
  value,
  options,
  onChange,
}) => {
  return (
    <div className={css.navbarSection}>
      {options.map(({ label, value: optionValue }) => {
        return (
          <div
            className={classNames(css.segment, {
              [css.active]: value === optionValue, 
            })}
            key={optionValue}
            onClick={() => onChange?.(optionValue)}
          >
            <span>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

export { NavbarSection };
