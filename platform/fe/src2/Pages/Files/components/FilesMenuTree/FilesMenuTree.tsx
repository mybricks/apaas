import React, { FC, ReactNode, useState, useEffect, memo } from "react";
import { NavigateFunction } from "react-router-dom";

import { MenuButton, Link } from "@/components";
import { TreeNode } from ".";
import { Files } from "../..";
import { CaretRight, Loading, Folder, UserGroup } from "@/components/icon";
import { useToggle } from "@/hooks";
import NodeSwitch from "../NodeSwitch";

import css from "./FilesMenuTree.less";

interface FilesMenuTreeProps {
  id?: string;
  depth?: number;
  icon: ReactNode;
  search?: string;
  activeSearch?: string;
  name: string;
  node: TreeNode;
  navigate: NavigateFunction;
  getFiles: (id: string) => Promise<Files>; // 返回文件列表
}

const FilesMenuTree: FC<FilesMenuTreeProps> = memo(({
  id,
  depth = 0,
  icon,
  search, // 有search就是可被选中的
  activeSearch,
  name,
  node,
  navigate,
  getFiles
}) => {
  const [open, toggleOpen] = useToggle(node.open); // 展开
  const [loading, setLoading] = useState(open && search ? true : false); // 展开加载
  const [files, setFiles] = useState<Files>([]); // 文件列表
  
  useEffect(() => {
    node.open = open;
    if (open && search) {
      setLoading(true);
      getFiles(id).then((files) => {
        setFiles(files);
        setLoading(false);
      });
    }
  }, [open])

  const handleMenuButtonClick = () => {
    if (!open) {
      toggleOpen();
    }
    navigate(search);
  }

  return (
    <>
      <MenuButton
        icon={icon}
        active={search === activeSearch}
        style={{paddingLeft: 4 + depth * 12}}
        prefix={<NodeSwitch loading={loading} open={open} onClick={toggleOpen}/>}
        onClick={handleMenuButtonClick}
      >
        {name}
      </MenuButton>
      {open && !loading && files.map((file) => {
        const { id, name, extName, groupId } = file;
        const isGroup = !!!extName && !!id;
        const nextNode = node.node;

        if (!nextNode[id]) {
          nextNode[id] = { open: false, node: {} };
        }

        return (
          <FilesMenuTree
            key={id}
            id={isGroup ? String(id) : `${groupId}-${id}`}
            search={`?appId=files${isGroup ? `&groupId=${id}` : `${groupId ? `&groupId=${groupId}` : ''}${id ? `&parentId=${id}` : ''}`}`}
            name={name}
            depth={depth + 1}
            icon={isGroup ? <UserGroup /> : <Folder />} // TODO
            node={nextNode[id]}
            activeSearch={activeSearch}
            navigate={navigate}
            getFiles={getFiles}
          />
        )
      })}
    </>
  )
}, (p, c) => {
  return p.activeSearch === c.activeSearch;
})

export default FilesMenuTree;
