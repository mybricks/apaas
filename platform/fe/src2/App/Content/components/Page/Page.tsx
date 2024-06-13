import React, { FC, PropsWithChildren } from "react";

import css from "./Page.less";

interface PageProps extends PropsWithChildren {

}

const Page: FC<PageProps> = ({ children }) => {
  return (
    <div className={css.page}>
      {children}
    </div>
  )
}

export default Page;

// import React, { useEffect } from "react";
// import { useLocation, Link } from "react-router-dom";

// import { useLocationConetxt } from "@/context";
// import { LocationContext } from "@/types";
// import Account from "./account";
// import Files from "./files";

// import css from "./detail.less";

// const DETAIL_MAP = {
//   account: Account,
//   files: () => <div>文件列表</div>
// }

// export interface JSXDefaultProps {
//   locationContext: LocationContext;
// }

// export default function Detail() {
//   const { params } = useLocationConetxt();
//   const JSX = DETAIL_MAP[params.appId];

//   return (
//     <div className={css.detail}>
//       {JSX ? <JSX /> : params.appId}
//     </div>
//   )
// }
