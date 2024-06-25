import React, { FC } from "react";

import { FilesContextValue } from "../../FilesProvider";
import Group from "./group";

import css from "./InformationPanel.less";

interface InformationPanelProps {
  filesContext: FilesContextValue;
}

const InformationPanel: FC<InformationPanelProps> = ({
  filesContext
}) => {
  const { loading, filesInfo: { filePaths } } = filesContext;

  if (filePaths.length === 1) {
    const lastFilePath = filePaths[0];
    if (lastFilePath.id) {
      return (
        <div className={css.informationPanel}>
          <Group {...lastFilePath} loading={loading}/>
        </div>
      )
    }
  }

  return null;
}

export default InformationPanel;
