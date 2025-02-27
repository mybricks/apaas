import React, { FC, useState } from "react";
import { SearchOutlined } from '@ant-design/icons'
import SearchModal from "./FilesSearchModal";
import css from './FilesSearchButton.less';

const FilesSearchButton: FC = () => {
  const [showSearch, setShowSearch] = useState(false);
  return (
    <>
      <div className={css.search} onClick={() => setShowSearch(true)}>
        搜索
        <SearchOutlined />
      </div>
      <SearchModal open={showSearch} onCancel={() => setShowSearch(false)}/>
    </>
  )
}

export default FilesSearchButton;
