import React, { FC } from "react";

import { Navbar, LoadingPlaceholder, Button, Popover } from "@/components";
import { ViewAsGrid, ViewAsList } from "@/components/icon";
import { useFilesContext } from "./FilesProvider";
import FilePathNavigation from "./components/FilePathNavigation";
// TODO: Next
import { Create } from "./components/FilesListContainer/create/Create";
import FilesSearchButton from "./components/FilesSearchButton";

import css from "./FilesHeader.less";

const FilesHeader: FC = () => {
  const { filePathsInfo: { loading, filePaths },  viewType, setViewType } = useFilesContext();
  
  return (
    <div className={css.filesHeader}>
      {/*{loading ? <LoadingPlaceholder /> : <FilePathNavigation paths={filePaths}/>}*/}
      <FilePathNavigation paths={filePaths}/>
      <div className={css.operationArea}>
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
        <FilesSearchButton />
        <Popover
          arrow={false}
          content={<Create />}
          placement="bottomRight"
          trigger="click"
        >
          <Button type={"primary"}>
            新 建
          </Button>
        </Popover>
      </div>
    </div>
  )
}

export default FilesHeader;
