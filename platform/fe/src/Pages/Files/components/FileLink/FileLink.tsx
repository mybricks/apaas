import React, { FC, PropsWithChildren } from "react";
import { Link } from "@/components";
import { FileData, InstalledApp } from "@/types";

interface FileLinkProps extends PropsWithChildren {
  file: FileData;
  app: InstalledApp
}

const FileLink: FC<FileLinkProps> = ({ file, app, children }) => {
  const { extName, id, groupId } = file;
  const isDesignApp = extName !== "folder";
  return (
    <Link
      to={isDesignApp ? `${app.homepage}?id=${id}` : `?appId=files${groupId ? `&groupId=${groupId}` : ''}${id ? `&parentId=${id}` : ''}`}
      target={isDesignApp ? "_blank" : "_self"}
    >
      {children}
    </Link>
  )
}

export default FileLink;
