import React, { FC, PropsWithChildren } from "react";

import FormLabel from "./FormLabel";

interface FormFieldProps extends PropsWithChildren {
  label?: string;
  className?: string;
}

const FormField: FC<FormFieldProps> = ({
  label,
  className,
  children
}) => {
  return (
    <div className={className}>
      {label && <FormLabel>{label}</FormLabel>}
      {children}
    </div>
  )
}

export default FormField;
