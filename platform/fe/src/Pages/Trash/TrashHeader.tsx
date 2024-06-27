import React, { FC } from "react";

import { Navbar } from "@/components";

const TrashHeader: FC = () => {
  return (
    <Navbar.Section
      value={"trash"}
      options={[{label: "回收站", value: "trash"}]}
    />
  )
}

export default TrashHeader;
