import React, { FC, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useUserContext } from "@/context";
import { TreeNode } from "./components/FilesMenuTree";
import { storage } from "@/utils/local";
import { isObject } from "@/utils/type";
import { MYBRICKS_WORKSPACE_DEFAULT_MY_FILETREE, MYBRICKS_WORKSPACE_DEFAULT_GROUP_FILETREE } from "@/const";
import MyMenuButton from "./components/MyMenuButton";
import GroupMenuButton from "./components/GroupMenuButton";


const FilesMenuButton: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { search: activeSearch } = location;
  const { user: { id: userId } } = useUserContext();
  const ref = useRef<{my: TreeNode, group: TreeNode}>();

  if (!ref.current) {
    ref.current = {
      my: getProxyTreeNode(MYBRICKS_WORKSPACE_DEFAULT_MY_FILETREE),
      group: getProxyTreeNode(MYBRICKS_WORKSPACE_DEFAULT_GROUP_FILETREE),
    };
  }

  const isMy = activeSearch === "?appId=files" || activeSearch.startsWith("?appId=files&parentId")
  const isGroup = activeSearch.startsWith("?appId=files&groupId");
  
  return (
    <>
      <MyMenuButton
        userId={userId}
        activeSearch={isMy ? activeSearch : null}
        node={ref.current.my}
        navigate={navigate}
      />
      <GroupMenuButton
        userId={userId}
        activeSearch={isGroup ? activeSearch : null}
        node={ref.current.group}
        navigate={navigate}
      />
    </>
  )
}

export default FilesMenuButton;

const getProxyTreeNode = (key: string) => {
  const node = storage.get(key) || {
    open: true,
    node: {}
  };
  return setTreeLocalProxy(node, node, key); 
}

/** 文件树展开收起状态自动写入storage */
const setTreeLocalProxy = (obj: object, parentObj: object, localKey: string) => {
  return new Proxy(obj, {
    set(target, key, value) {
      const preValue = target[key]

      target[key] = value;

      if (key === 'open' || key === 'node') {
        if (preValue !== value) {
          if (value === false) {
            Reflect.set(target, 'node', {})
          }
          storage.set(localKey, parentObj)
        }
      }

      return true
    },
    get(target, key) {
      let value = target[key]

      if (isObject(value)) {
        value = setTreeLocalProxy(value, parentObj, localKey)
      }

      return value
    }
  }) as TreeNode;
}
