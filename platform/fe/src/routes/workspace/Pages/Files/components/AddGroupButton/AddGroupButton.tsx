import React, { FC } from "react";
import { Tooltip } from "antd";

import { Plus } from "@workspace/components/icon";
import { useModalConetxt, useUserContext } from "@workspace/context";
import AddNewGroupModal from "../AddNewGroupModal";
import { FilesMenuTreeContextValue } from "@workspace/types";

import css from "./AddGroupButton.less";

interface AddGroupButtonProps {
  filesMenuTreeContext: FilesMenuTreeContextValue;
}

const AddGroupButton: FC<AddGroupButtonProps> = ({ filesMenuTreeContext }) => {
  const { user: { id: userId } } = useUserContext();
  const { showModal } = useModalConetxt();
  
  const handlePlusClick = () => {
    showModal(AddNewGroupModal, { userId, filesMenuTreeContext });
  }

  return (
    <div className={css.addGroupButton}>
      <span>我加入的协作组</span>
      <Tooltip placement="top" title="建立新的协作组" arrow={false}>
        <button onClick={handlePlusClick}>
          <Plus />
        </button>
      </Tooltip>
    </div>
  );
}

export default AddGroupButton;
