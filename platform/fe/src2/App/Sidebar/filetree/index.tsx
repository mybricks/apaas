import React, { useEffect, useState } from "react";
import axios from "axios";
import classNames from "classnames";
import { NavigateFunction } from "react-router-dom";

import { storage } from "@/utils/local";
import { isObject } from "@/utils/type";
import { MYBRICKS_WORKSPACE_DEFAULT_MY_FILETREE } from "@/const";
import { MenuButton } from "@/components";
import { UserGroup, Loading, CaretRight } from "@/components/icon";
import { useUserContext, useLocationConetxt } from "@/context";
import { useToggle } from "@/hooks";

import css from "./index.less";

interface Leaf {
  open: boolean;
  leaf: {
    [key: string]: Leaf;
  }
}

interface File {

}

interface FileTreeProps {
  id: string;
  title: string;
  leaf: Leaf;
  search: string;
  locationSearch: string;
  getFiles: (id: string) => Promise<File[]>;
  navigate: NavigateFunction;
}

export default function FileTree({ id, title, search, leaf, locationSearch, navigate, getFiles }: FileTreeProps) {
  // console.log("leaf: ", leaf)

  // const [open, setOpen] = useState(leaf.open); // 展开文件列表
  const [open, toggleOpen] = useToggle(leaf.open);
  const [loading, setLoading] = useState(open && search ? true : false); // 展开加载
  const [files, setFiles] = useState([]); // 文件列表
  
  useEffect(() => {
    if (open && search) {
      setLoading(true);
      getFiles(id).then((files) => {
        setFiles(files);
        setLoading(false);
      });
    }
  }, [open])

  const handleSwitchClick: React.MouseEventHandler<HTMLSpanElement> = (e) => {
    e.stopPropagation();
    toggleOpen();
  }

  const handleButtonClick = () => {
    if (!open) {
      toggleOpen();
    }
    navigate(search);
  }

  return (
    <MenuButton
      icon={<UserGroup />}
      prefix={<LeafSwitch loading={loading} open={open} onClick={handleSwitchClick} />}
      onClick={handleButtonClick}
      search={search}
      locationSearch={locationSearch}
    >
      {title}
    </MenuButton>
  )
}

interface LeafSwitchProps {
  loading: boolean;
  open: boolean;
  onClick: React.MouseEventHandler<HTMLSpanElement>;
}

console.log("处理下这里的样式，先实现功能吧: ")
function LeafSwitch({ loading, open, onClick }: LeafSwitchProps) {

  return (
    <div onClick={onClick} className={classNames({[css.switchopen]: !loading && open})}>
      {loading ? 
        <Loading /> : 
        open ? <CaretRight /> : <CaretRight />
      }
    </div>
  )
}

interface MyProps {
  locationSearch: string;
  navigate: NavigateFunction
}

export function My({ navigate, locationSearch }: MyProps) {
  const { user: { id: userId } } = useUserContext();
  const fileTree = storage.get(MYBRICKS_WORKSPACE_DEFAULT_MY_FILETREE) || {
    open: true,
    leaf: {}
  };
  const proxyFileTree = setTreeLocalProxy(fileTree, fileTree, MYBRICKS_WORKSPACE_DEFAULT_MY_FILETREE);

  return (
    <FileTree
      id="my"
      title="我的"
      search={"?appId=files"}
      leaf={proxyFileTree}
      locationSearch={locationSearch}
      navigate={navigate}
      getFiles={async (id) => {
        const parentId = id === "my" ? null : id.split('-')[1];
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

export function Group() {
  return (
    <div>我加入的协作组</div>
  )
}

/** 文件树展开收起状态自动写入storage */
function setTreeLocalProxy (obj: object, parentObj: object, localKey: string) {
  return new Proxy(obj, {
    set(target, key, value) {
      const preValue = target[key]

      target[key] = value

      if (key === 'open' || key === 'leaf') {
        if (preValue !== value) {
          if (value === false) {
            Reflect.set(target, 'leaf', {})
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
  }) as Leaf;
}
