import React, { FC } from "react";

import FilesListContainer from "./components/FilesListContainer";
import { useFilesContext } from "./FilesProvider";
import { useUserContext } from "@workspace/context";
import InformationPanel from "./components/InformationPanel";

import css from "./FilesPage.less";

const FilesPage: FC = () => {
  const { user } = useUserContext();
  const filesContext = useFilesContext();

  return (
    <div className={css.page}>
      <div className={css.container}>
        <FilesListContainer
          user={user}
          filesContext={filesContext}
        />
      </div>
      <InformationPanel filesContext={filesContext}/>
    </div>
  )
}

export default FilesPage;
