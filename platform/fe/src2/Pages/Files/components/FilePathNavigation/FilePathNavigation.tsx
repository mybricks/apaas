import React, { FC } from "react";
import { Breadcrumb } from "antd";

import { FilePath, FilePaths } from "../../";
import { Link } from "@/components";

interface FilePathProps {
  paths: FilePaths;
}

const transformPathToSearch = ({ id, groupId, extName }: FilePath) => {
  return "?appId=files" +
    (!extName && id ? `&groupId=${id}` : '') +
    (groupId ? `&groupId=${groupId}` : '') +
    (id ? `&parentId=${id}` : '');
}

const FilePathNavigation: FC<FilePathProps> = ({ paths }) => {
  const lastPathsIndex = paths.length - 1;
  return (
    <Breadcrumb
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
