import React, { FC } from "react";
import classNames from "classnames";

import css from "./Input.less";

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  className?: string;
  label?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

const Input: FC<InputProps> = ({ value, onChange, error, className, label, placeholder, autoFocus }) => {
  return (
    <div className={classNames(css.input, className)}>
      {label && (
        <label>
          {label}
        </label>
      )}
      <input
        className={classNames({[css.error]: error})}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
      />
    </div>
  )
}

export default Input;
