import React, { FC, PropsWithChildren } from "react";

import css from "./Page.less";

interface PageProps extends PropsWithChildren {}

const Page: FC<PageProps> = ({ children }) => {
  return (
    <div className={css.page}>
      <div className={css.scroll}>
        {children}
      </div>
    </div>
  )
}

export default Page;
