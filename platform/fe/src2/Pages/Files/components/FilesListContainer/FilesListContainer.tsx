import React, { FC } from "react";

import { Files, ViewType } from "../..";
import { User } from "@/types";
import ViewAsTable from "./ViewAsTable";
import ViewAsGrid from "./ViewAsGrid";

interface FilesListContainerProps {
  user: User;
  files: Files;
  loading: boolean;
  viewType: ViewType;
  roleDescription: number;
}

const FilesListContainer: FC<FilesListContainerProps> = ({
  user,
  files,
  loading,
  viewType,
  roleDescription
}) => {
  if (viewType === "grid") {
    return <ViewAsGrid user={user} files={files} roleDescription={roleDescription}/>
  }
  return <ViewAsTable user={user} files={files} loading={loading} roleDescription={roleDescription}/>
}

export default FilesListContainer;
