import React, { FC, PropsWithChildren } from "react";

import css from "./Header.less";

interface HeaderProps extends PropsWithChildren {

}

const Header: FC<HeaderProps> = ({ children }) => {
  return (
    <div className={css.header}>
      {children}
    </div>
  )
}

export default Header;


// import React, { useState } from "react";
// import classNames from "classnames";
// import { Tooltip } from "antd";

// import { ViewAsList, ViewAsGrid } from "@workspace/components/icon";

// import css from "./header.less";

// const viewOptions = [
//   {
//     type: "grid",
//     icon: <ViewAsGrid />,
//     tip: "切换为网格视图"
//   },
//   {
//     type: "list",
//     icon: <ViewAsList />,
//     tip: "切换为列表视图"
//   }
// ];

// export default function Header() {
//   const [viewType, setViewType] = useState("grid");
//   return (
//     <div className={css.header}>
//       <div className={css.searchBar}>
//         {/* TODO: 全局查询、当前视图查询？ */}
//       </div>
//       <div className={css.actionBar}>
//         <span>查看方式</span>
//         <div className={css.viewOptions}>
//           {viewOptions.map(({ type, icon, tip }) => {
//             return (
//               <Tooltip placement="bottomRight" title={tip} arrow={false}>
//                 <button
//                   key={type}
//                   className={classNames({[css.viewSelect]: viewType === type})}
//                   onClick={() => setViewType(type)}
//                 >
//                   {icon}
//                 </button>
//               </Tooltip>
//             )
//           })}
//         </div>
//       </div>
//     </div>
//   )
// }


// .header {
//   position: relative;
//   display: flex;
//   height: 49px;
//   border-bottom: 1px solid rgb(230, 230, 230);
//   width: 100%;
//   align-items: center;
//   background: rgb(255, 255, 255);
//   justify-content: space-between;

//   .searchBar {
//     display: flex;
//     height: 100%;
//     min-height: 100%;
//     align-items: center;
//     flex: 1;
//     overflow: hidden;
//     justify-content: flex-start;
//   }

//   .actionBar {
//     display: flex;
//     height: 100%;
//     min-height: 100%;
//     align-items: center;
//     flex: 1;
//     overflow: hidden;
//     justify-content: flex-end;

//     span {
//       font-size: 13px;
//       color: rgba(0, 0, 0, 0.55);
//       margin-right: 8px;
//     }

//     .viewOptions {
//       margin-right: 8px;

//       button {
//         cursor: pointer;
//         height: 32px;
//         color: rgba(0, 0, 0, 0.7);
//         border-radius: 6px;
//         border: none;
//         background: transparent;;
//         transition: background 100ms ease-in-out 0s, color 100ms ease-in-out 0s;
//         padding: 4px 8px;
  
//         svg {
//           width: 24px;
//           height: 24px;
//         }

//         &:hover {
//           background-color: rgba(0, 0, 0, 0.04);
//           color: rgb(0, 0, 0);
//         }
//       }

//       .viewSelect {
//         background-color: rgba(242, 103, 38, 0.1) !important;
//         color: rgb(242, 103, 38) !important;
//       }
//     }
//   }
// }
