import React, { FC, ReactNode } from "react";

import { Modal, Button } from "@/components";
import { ModalInjectedProps } from "@/types";

interface ModalConfirmationProps extends ModalInjectedProps {
  title: string | ReactNode;
  content?: string | ReactNode;
  okText?: string;
  cancelText?: string;
  onOk?: () => void;
  onCancel?: () => void;
}

const ModalConfirmation: FC<ModalConfirmationProps> = ({
  title,
  content,
  okText = "确 认",
  cancelText = "取 消",
  onOk,
  onCancel,
  hideModal
}) => {
  const handleOkClick = () => {
    if (onOk) {
      onOk();
    } else {
      handleCancelClick();
    }
  }

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    } else {
      hideModal();
    }
  }

  return (
    <Modal title={title}>
      <Modal.Body>
        {content}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={handleCancelClick}>
          {cancelText}
        </Button>
        <Button
          type="primary"
          onClick={handleOkClick}
        >
          {okText}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ModalConfirmation;