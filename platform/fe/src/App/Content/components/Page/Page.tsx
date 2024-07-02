import React, { CSSProperties, FC, PropsWithChildren } from "react";

import css from "./Page.less";

interface PageProps extends PropsWithChildren {
  style?: CSSProperties
}

const Page: FC<PageProps> = ({ children, style }) => {
  return (
    <div className={css.page} style={style}>
      <div className={css.scroll}>
        {children}
      </div>
    </div>
  )
}

export default Page;
