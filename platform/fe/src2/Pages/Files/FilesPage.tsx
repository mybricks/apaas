import React, { FC } from "react";

import FilesListContainer from "./components/FilesListContainer";
import { useFilesContext } from "./FilesProvider";
import { useUserContext } from "@/context";
import { LoadingPlaceholder } from "@/components";

import css from "./FilesPage.less";

const FilesPage: FC = () => {
  const { user } = useUserContext();
  const { loading, filesInfo: { files, roleDescription }, viewType } = useFilesContext();

  if (viewType === "grid") {
    if (loading) {
      return (
        <div className={css.loading}>
          <LoadingPlaceholder size={64}/>
        </div>
      )
    }
  
    if (!files.length) {
      return "暂无内容，请添加...";
    }
  }

  return (
    <FilesListContainer
      user={user}
      files={files}
      loading={loading}
      viewType={viewType}
      roleDescription={roleDescription}
    />
  )
}

export default FilesPage;
