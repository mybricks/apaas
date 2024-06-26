import React, { FC, ReactNode, useState } from "react";

import { Modal, Button } from "@/components";
import { ModalInjectedProps } from "@/types";

interface ModalConfirmationProps extends ModalInjectedProps {
  title: string | ReactNode;
  content?: string | ReactNode;
  okText?: string;
  cancelText?: string;
  onOk?: () => void | Promise<any>;
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
  const [loading, setLoading] = useState(false);
  const handleOkClick = () => {
    if (onOk) {
      const res = onOk();
      if (res instanceof Promise) {
        setLoading(true);
        res.then(() => {
          handleCancelClick();
        }).catch(() => {
          setLoading(false);
        });
      }
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
          loading={loading}
        >
          {okText}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ModalConfirmation;