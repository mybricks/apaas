import React, {FC} from "react";
import {NavigateFunction} from "react-router-dom";
import axios from "axios";

import FilesMenuTree from "../FilesMenuTree";
import {My,Account} from "@workspace/components/icon";
import {TreeNode} from "../FilesMenuTree";
import {FilesMenuTreeContextValue} from "@workspace/types";


interface MyMenuButtonProps {
  userId: number;
  node: TreeNode;
  activeSearch?: string;
  navigate: NavigateFunction;
  filesMenuTreeContext: FilesMenuTreeContextValue;
}

const MyMenuButton: FC<MyMenuButtonProps> = ({
                                               node,
                                               userId,
                                               activeSearch,
                                               navigate,
                                               filesMenuTreeContext
                                             }) => {
  return (
    <FilesMenuTree
      icon={My}
      search={`?appId=files`}
      activeSearch={activeSearch}
      name={"我的"}
      node={node}
      navigate={navigate}
      filesMenuTreeContext={filesMenuTreeContext}
      getFiles={async (id) => {
        const parentId = id ? id.split('-')[1] : null;
        const files = (await axios.get("/paas/api/file/getMyFiles", {
          params: {
            userId,
            extNames: "folder",
            parentId
          }
        })).data.data;
        
        return files;
      }}
    />
  )
}


export default MyMenuButton;
