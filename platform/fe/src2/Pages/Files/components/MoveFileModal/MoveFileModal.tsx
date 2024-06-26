import React, { FC, useState } from "react";
import axios from "axios";
import { message } from "antd";

import { Modal, Button } from "@/components";
import { ModalInjectedProps, User, FileData } from "@/types";
import FolderList from "./FolderList";

interface MoveFileModalProps extends ModalInjectedProps {
  user: User;
  file: FileData;
  next: (params: {targetFile: FileData, file: FileData}) => void;
}

const MoveFileModal: FC<MoveFileModalProps> = ({
  user,
  file,
  next,
  hideModal
}) => {
  const [loading, setLoading] = useState(false);
  const [targetFile, setTargetFile] = useState<FileData>(null);

  const handleConfirmButtonClick = () => {
    setLoading(true);

    const { id, groupId } = targetFile;

    if (file.id === id) {
      message.error(`目标文件夹“${file.name}”已被选中，无法移动`);
    } else {
      const isGroup = typeof groupId === 'undefined';
      const data: any = {
        fileId: file.id,
      }
      if (isGroup) {
        data.toGroupId = id
      } else {
        data.toFileId = id
      }
      axios({
        method: 'post',
        url: '/api/file/moveFile',
        data
      }).then(async ({data: {data: message2}}) => {
        if (typeof message2 === 'string') {
          message.error(message2);
          setLoading(false);
        } else {
          let responseFile = file;

          if (!targetFile.extName) {
            responseFile = {
              ...file,
              parentId: null,
              groupId: targetFile.id
            }
          } else {
            responseFile = {
              ...file,
              parentId: targetFile.id,
              groupId: targetFile.groupId
            }
          }

          next({ targetFile, file: responseFile })
          hideModal()
          message.success("移动成功")
        }
      })
    }
  }

  return (
    <Modal title={`将“${file.name}”移动到`}>
      <Modal.Body>
        <FolderList user={user} file={file} setTargetFile={setTargetFile}/>
      </Modal.Body>
      <Modal.Footer>
        <Button disabled={loading} onClick={hideModal}>
          取 消
        </Button>
        <Button
          type="primary"
          onClick={handleConfirmButtonClick}
          disabled={!targetFile}
          loading={loading}
        >
          确 认
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default MoveFileModal;
