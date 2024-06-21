import React, { FC, ReactNode, useState, useEffect, memo } from "react";
import { NavigateFunction } from "react-router-dom";

import { MenuButton } from "@/components";
import { TreeNode } from ".";
import { Files } from "../..";
import { Folder, UserGroup } from "@/components/icon";
import { useToggle } from "@/hooks";
import NodeSwitch from "../NodeSwitch";
import { FilesMenuTreeContextValue } from "@/types";

import css from "./FilesMenuTree.less";

interface FilesMenuTreeProps {
  id?: string;
  clickable?: boolean;
  icon: ReactNode;
  search?: string;
  activeSearch?: string;
  name: string | ReactNode;
  node: TreeNode;
  navigate: NavigateFunction;
  getFiles: (id: string) => Promise<Files>;
  filesMenuTreeContext: FilesMenuTreeContextValue;
}

const FilesMenuTree: FC<FilesMenuTreeProps> = memo(({
  id,
  clickable = true,
  icon,
  search,
  activeSearch,
  name,
  node,
  navigate,
  getFiles,
  filesMenuTreeContext
}) => {
  const [open, toggleOpen] = useToggle(node.open);
  const [loading, setLoading] = useState(open && search ? true : false);
  const [files, setFiles] = useState<Files>([]);

  useEffect(() => {
    if (search) {
      filesMenuTreeContext.registerNode(search, async () => {
        if (node.open) {
          getFiles(id).then((files) => {
            setFiles(files);
          });
        }
      })
      return () => {
        filesMenuTreeContext.unregisterNode(search);
      }
    }
  }, [])
  
  useEffect(() => {
    node.open = open;
    if (open) {
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
    if (search) {
      navigate(search);
    }
  }

  return (
    <>
      <MenuButton
        icon={icon}
        clickable={clickable}
        active={search === activeSearch}
        style={{ paddingLeft: 4 }}
        prefix={<NodeSwitch loading={loading} open={open} onClick={toggleOpen}/>}
        onClick={handleMenuButtonClick}
      >
        {name}
      </MenuButton>
      {open && !loading && (
        <div className={css.nextFiles}>
          {files.map((file) => {
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
                icon={isGroup ? <UserGroup /> : <Folder />} // TODO
                node={nextNode[id]}
                activeSearch={activeSearch}
                navigate={navigate}
                getFiles={getFiles}
                filesMenuTreeContext={filesMenuTreeContext}
              />
            )
          })}
        </div>
      )}
    </>
  )
}, (p, c) => {
  return p.activeSearch === c.activeSearch;
})

export default FilesMenuTree;
