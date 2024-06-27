import React, { FC, useMemo } from "react";

import { FilesContextValue } from "../../FilesProvider";
import Group from "./group";

import css from "./InformationPanel.less";

interface InformationPanelProps {
  filesContext: FilesContextValue;
}

const InformationPanel: FC<InformationPanelProps> = ({
  filesContext
}) => {
  const { filePathsInfo: { params } } = filesContext;

  const render = useMemo(() => {
    if (params.groupId && !params.parentId) {
      return (
        <div className={css.informationPanel}>
          <Group id={params.groupId}/>
        </div>
      )
    }

    return null
  }, [params])

  return render
}

export default InformationPanel;
