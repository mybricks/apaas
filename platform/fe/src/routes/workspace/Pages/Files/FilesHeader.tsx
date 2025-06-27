import React, {FC, useState, useEffect, useRef, useLayoutEffect} from "react";

import {Navbar, LoadingPlaceholder, Button, Popover} from "@workspace/components";
import {ArrowDown, ViewAsGrid, ViewAsList} from "@workspace/components/icon";
import {useFilesContext} from "./FilesProvider";
import FilePathNavigation from "./components/FilePathNavigation";
// TODO: Next
import {Create} from "./components/FilesListContainer/create/Create";
import FilesSearchButton from "./components/FilesSearchButton";

import css from "./FilesHeader.less";

const CreateWrapper = ({ onClose }) => {
  const contentRef = useRef(null);

  useLayoutEffect(() => {
    const handleClickOutside = (event) => {
      // 获取点击的元素
      const target = event.target;
      if (!contentRef.current?.contains?.(target)) {
        onClose?.()
      }
    };
    // 添加点击事件监听
    document.getElementById('root').addEventListener('click', handleClickOutside);
    // 清理函数
    return () => {
      document.getElementById('root').removeEventListener('click', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={contentRef}
      onClick={(e) => { e.stopPropagation() }}
    >
      <Create/>
    </div>
  )
}

const FilesHeader: FC = () => {
  const {filePathsInfo: {loading, filePaths}, viewType, setViewType, filesInfo} = useFilesContext();
  const [popOpen, setPopOpen] = useState(false)

  return (
    <div className={css.filesHeader}>
      {/*{loading ? <LoadingPlaceholder /> : <FilePathNavigation paths={filePaths}/>}*/}
      <FilePathNavigation paths={filePaths}/>
      <div className={css.operationArea}>
        <Navbar.Section<typeof viewType>
          value={viewType}
          onChange={setViewType}
          options={[
            viewType === 'list' ? {
              label: <ViewAsList/>,
              value: "grid",
              tip: "切换为网格视图"
            } : {
              label: <ViewAsGrid/>,
              value: "list",
              tip: "切换为列表视图"
            },
          ]}
        />
        <FilesSearchButton/>
        <Popover
          arrow={false}
          content={<CreateWrapper onClose={() => setPopOpen(false)} />}
          placement="bottomRight"
          open={popOpen}
        >
          <Button type={"primary"} style={{ fontWeight: 'bold' }} disabled={![1, 2].includes(filesInfo.roleDescription)} onClick={() => setPopOpen(true)}>
            <label className={css.addIcon}>+</label>
            新建
            {/* <span className={css.downIcon}>{ArrowDown}</span> */}
          </Button>
        </Popover>
      </div>
    </div>
  )
}

export default FilesHeader;
