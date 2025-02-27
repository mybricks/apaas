import React, {FC} from "react";
import {NavigateFunction} from "react-router-dom";
import axios from "axios";

import FilesMenuTree from "../FilesMenuTree";
import {Cooperation, UserGroup} from "@workspace/components/icon";
import {TreeNode} from "../FilesMenuTree";
import AddGroupButton from "../AddGroupButton";
import {FilesMenuTreeContextValue} from "@workspace/types";

interface GroupMenuButtonProps {
  userId: number;
  node: TreeNode;
  activeSearch?: string;
  navigate: NavigateFunction;
  filesMenuTreeContext: FilesMenuTreeContextValue;
}

const GroupMenuButton: FC<GroupMenuButtonProps> = ({
                                                     node,
                                                     userId,
                                                     activeSearch,
                                                     navigate,
                                                     filesMenuTreeContext
                                                   }) => {
  return (
    <FilesMenuTree
      icon={Cooperation}
      clickable={false}
      search={"group"}
      activeSearch={activeSearch}
      name={<AddGroupButton filesMenuTreeContext={filesMenuTreeContext}/>}
      node={node}
      navigate={navigate}
      filesMenuTreeContext={filesMenuTreeContext}
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
