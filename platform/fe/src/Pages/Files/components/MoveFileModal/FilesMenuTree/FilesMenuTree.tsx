import React, { FC, ReactNode, useState, useEffect, memo } from "react";

import { MenuButton } from "@/components";
import { Folder, UserGroup } from "@/components/icon";
import { useToggle } from "@/hooks";
import NodeSwitch from "../../NodeSwitch";
import { FileData } from "@/types";

import css from "./FilesMenuTree.less";

interface FilesMenuTreeProps {
  clickable?: boolean;
  icon: ReactNode;
  file?: FileData;
  moveFile: FileData;
  targetFile?: FileData;
  name: string | ReactNode;
  defaultOpen?: boolean;
  getFiles: (file?: FileData) => Promise<FileData[]>;
  onChange: (file?: FileData) => void;
}

const FilesMenuTree: FC<FilesMenuTreeProps> = memo(({
  clickable = true,
  icon,
  file,
  moveFile,
  targetFile,
  name,
  defaultOpen = false,
  getFiles,
  onChange
}) => {
  const [open, toggleOpen] = useToggle(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileData[]>([]);
  
  useEffect(() => {
    if (open) {
      setLoading(true);
      getFiles(file).then((files) => {
        setFiles(files);
        setLoading(false);
      });
    } else {
      setFiles([]);
    }
  }, [open])
  
  const handleMenuButtonClick = () => {
    if (!open) {
      toggleOpen();
    }
    file && onChange(file);
  }
  
  return (
    <>
      <MenuButton
        icon={icon}
        clickable={clickable}
        active={file && (file.id === targetFile?.id)}
        style={{paddingLeft: 4}}
        prefix={<NodeSwitch open={open} onClick={toggleOpen}/>}
        onClick={handleMenuButtonClick}
      >
        {name}
      </MenuButton>
      {open && !loading && (
        <div className={css.nextFiles}>
          {files.map((file) => {
            const { id, name, extName } = file;
            const isGroup = !extName && id;

            return (file.id !== moveFile.id) && (
              <FilesMenuTree
                key={id}
                name={name}
                icon={isGroup ? UserGroup : Folder}
                file={file}
                moveFile={moveFile}
                targetFile={targetFile}
                getFiles={getFiles}
                onChange={onChange}
              />
            )
          })}
        </div>
      )}
    </>
  )
}, (p, c) => {
  return p.targetFile === c.targetFile
})

export default FilesMenuTree;
