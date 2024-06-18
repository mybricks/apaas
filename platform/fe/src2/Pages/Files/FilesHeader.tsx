import React, { FC } from "react";

import { Navbar } from "@/components";
import { ViewAsGrid, ViewAsList } from "@/components/icon";
import { useFilesContext } from "./FilesProvider";

import css from "./FilesHeader.less";

const FilesHeader: FC = () => {
  const { viewType, setViewType } = useFilesContext();
  return (
    <div className={css.filesHeader}>
      <Navbar.Section<typeof viewType>
        value={viewType}
        onChange={setViewType}
        options={[
          {
            label: <ViewAsGrid />,
            value: "grid",
            tip: "切换为网格视图"
          },
          {
            label: <ViewAsList />,
            value: "list",
            tip: "切换为列表视图"
          },
        ]}
      />
    </div>
  )
}

export default FilesHeader;
