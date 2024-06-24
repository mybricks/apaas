import React, { FC } from "react";

import FilesListContainer from "./components/FilesListContainer";
import { useFilesContext } from "./FilesProvider";
import { useUserContext } from "@/context";
import { LoadingPlaceholder } from "@/components";

import css from "./FilesPage.less";

const FilesPage: FC = () => {
  const { user } = useUserContext();
  const filesContext = useFilesContext();

  if (filesContext.viewType === "grid") {
    if (filesContext.loading) {
      return (
        <div className={css.loading}>
          <LoadingPlaceholder size={64}/>
        </div>
      )
    }
  
    if (!filesContext.filesInfo.files.length) {
      return "暂无内容，请添加...";
    }
  }

  return (
    <FilesListContainer
      user={user}
      filesContext={filesContext}
    />
  )
}

export default FilesPage;
