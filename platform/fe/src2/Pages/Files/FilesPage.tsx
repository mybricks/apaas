import React, { FC } from "react";

import { Link } from "@/components";

const FilesPage: FC = () => {
  return (
    <Link 
      to={`?appId=files&groupId=${Math.random()}`}
    >文件列表</Link>
  )
}

export default FilesPage;
