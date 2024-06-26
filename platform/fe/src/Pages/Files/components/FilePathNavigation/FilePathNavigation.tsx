import React, { FC } from "react";
import { Breadcrumb } from "antd";

import { FilePath, FilePaths } from "../../";
import { Link } from "@/components";

import css from "./FilePathNavigation.less";

interface FilePathProps {
  paths: FilePaths;
}

const transformPathToSearch = ({ id, groupId, extName }: FilePath) => {
  return  "?appId=files" + 
    ((!extName && id) ? 
      `&groupId=${id}` : 
      groupId ? 
      `&groupId=${groupId}&parentId=${id}` : 
      (id ? `&parentId=${id}` : 
      ""
    ));
}

const FilePathNavigation: FC<FilePathProps> = ({ paths }) => {
  const lastPathsIndex = paths.length - 1;
  return (
    <Breadcrumb
      className={css.filePathNavigation}
      items={paths.map((path, index) => {
        const { name } = path;

        return {
          title: index === lastPathsIndex ? 
            name : 
            (
              <Link to={transformPathToSearch(path)}>
                {name}
              </Link>
            )
        }
      })}
    />
  )
}

export default FilePathNavigation;
