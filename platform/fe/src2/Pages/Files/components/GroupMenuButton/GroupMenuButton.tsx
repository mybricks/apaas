import React, { FC } from "react";
import { NavigateFunction } from "react-router-dom";
import axios from "axios";

import FilesMenuTree from "../FilesMenuTree";
import { UserGroup } from "@/components/icon";
import { TreeNode } from "../FilesMenuTree";

interface GroupMenuButtonProps {
  userId: number;
  node: TreeNode;
  activeSearch?: string;
  navigate: NavigateFunction;
}

const GroupMenuButton: FC<GroupMenuButtonProps> = ({
  node,
  userId,
  activeSearch,
  navigate
}) => {
  return (
    <FilesMenuTree
      icon={<UserGroup />}
      activeSearch={activeSearch}
      name={"我加入的协作组"}
      node={node}
      navigate={navigate}
      getFiles={async (id) => {
        const [groupId, parentId] = id?.split('-') || [];
        if (groupId) {
          const files = (await axios.get("/paas/api/file/getGroupFiles", {
            params: {
              userId,
              extNames: "folder",
              parentId,
              groupId
            }
          })).data.data;
          return files;
        } else {
          const groups = (await axios.get("/paas/api/userGroup/getVisibleGroups", {
            params: {
              userId
            }
          })).data.data;
          return groups;
        }
      }}
    />
  )
}


export default GroupMenuButton;
