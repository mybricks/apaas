import React, { FC } from "react";
import { Tooltip } from "antd";

import { Plus } from "@/components/icon";
import { useModalConetxt, useUserContext } from "@/context";
import AddNewGroupModal from "../AddNewGroupModal";

import css from "./AddGroupButton.less";

const AddGroupButton: FC = () => {
  const { user: { id: userId } } = useUserContext();
  const { showModal } = useModalConetxt();
  
  const handlePlusClick = () => {
    showModal(AddNewGroupModal, { userId });
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
