import React, { ReactNode } from "react";
import classNames from "classnames";
import { Tooltip } from "antd";

import css from "./NavbarSection.less";

interface NavbarSectionProps<T> {
  value: T;
  options: {
    tip?: string;
    label: string | ReactNode;
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
      {options.map(({ label, value: optionValue, tip }) => {
        const segment = (
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

        if (tip) {
          return (
            <Tooltip placement="bottomRight" title={tip} arrow={false}>
              {segment}
            </Tooltip>
          )
        }

        return segment;
      })}
    </div>
  )
}

export { NavbarSection };
