import React, { FC } from "react";
import { NavigateFunction } from "react-router-dom";
import axios from "axios";

import FilesMenuTree from "../FilesMenuTree";
import { Account } from "@/components/icon";
import { TreeNode } from "../FilesMenuTree";

interface MyMenuButtonProps {
  userId: number;
  node: TreeNode;
  activeSearch?: string;
  navigate: NavigateFunction;
}

const MyMenuButton: FC<MyMenuButtonProps> = ({
  node,
  userId,
  activeSearch,
  navigate
}) => {
  return (
    <FilesMenuTree
      icon={<Account />}
      search={`?appId=files`}
      activeSearch={activeSearch}
      name={"我的"}
      node={node}
      navigate={navigate}
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
