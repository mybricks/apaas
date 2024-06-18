import React, { FC, useEffect, useRef } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { useUserContext, useLocationConetxt } from "@/context";
import { MenuButton, Link } from "@/components";
import { Account, CaretRight, Loading } from "@/components/icon";
import FilesMenuTree, { TreeNode } from "./components/FilesMenuTree";
import { storage } from "@/utils/local";
import { isObject } from "@/utils/type";
import { MYBRICKS_WORKSPACE_DEFAULT_MY_FILETREE } from "@/const";

import css from "./FilesMenuButton.less";

const id = "files";
const search = `?appId=${id}`;

const FilesMenuButton: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { search: activeSearch } = location;
  const { user: { id: userId } } = useUserContext();
  const ref = useRef<TreeNode>();

  if (!ref.current) {
    ref.current = getProxyTreeNode(MYBRICKS_WORKSPACE_DEFAULT_MY_FILETREE);
  }
  
  return (
    <FilesMenuTree
      icon={<Account />}
      search={`?appId=files`}
      activeSearch={activeSearch.startsWith("?appId=files") ? activeSearch : null}
      name={"我的"}
      node={ref.current}
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
    // <Link to={search}>
    //   <MenuButton
    //     icon={<Account />}
    //     search={search}
    //     prefix={<span className={css.icon}><CaretRight /></span>}
    //     className={css.filesMenuButton}
    //   >
    //     我的
    //   </MenuButton>
    // </Link>
  )
}

export {
  id,
  FilesMenuButton
};


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