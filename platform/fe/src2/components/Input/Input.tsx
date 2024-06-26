import React, { FC } from "react";
import classNames from "classnames";

import css from "./Input.less";

interface InputProps {
  name: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  error?: boolean;
  className?: string;
  label?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

const Input: FC<InputProps> = ({
  name,
  value,
  onChange,
  error,
  className,
  label,
  placeholder,
  autoFocus
}) => {
  return (
    <div className={classNames(css.input, className)}>
      {label && (
        <label>
          {label}
        </label>
      )}
      <input
        name={name}
        className={classNames({[css.error]: error})}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
      />
    </div>
  )
}

export default Input;
