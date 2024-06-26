import React, { FC, useState } from "react";

import { Button } from "@/components";
import SearchModal from "./FilesSearchModal";

const FilesSearchButton: FC = () => {
  const [showSearch, setShowSearch] = useState(false);
  return (
    <>
      <Button onClick={() => setShowSearch(true)}>
        搜 索
      </Button>
      <SearchModal open={showSearch} onCancel={() => setShowSearch(false)}/>
    </>
  )
}

export default FilesSearchButton;
