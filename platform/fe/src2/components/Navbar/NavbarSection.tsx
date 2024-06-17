import React from "react";
import classNames from "classnames";

import css from "./NavbarSection.less";

interface NavbarSectionProps<T> {
  value: T;
  options: {
    label: string;
    value: T;
  }[];
  onChange?: (value: T) => void;
}

function NavbarSection<T extends string>({
  value,
  options,
  onChange,
}: NavbarSectionProps<T>) {
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
