import React from "react";
import classNames from "classnames";

import css from "./index.less";

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  className?: string;
  label?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function Input({ value, onChange, error, className, label, placeholder, autoFocus }: InputProps) {
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
