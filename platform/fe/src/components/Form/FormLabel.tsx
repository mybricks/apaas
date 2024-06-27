import React, { FC, PropsWithChildren } from "react";

import css from "./FormLabel.less";

const FormLabel: FC<PropsWithChildren> = ({ children }) => {
  return <span className={css.formLabel}>{children}</span>
}

export default FormLabel;
