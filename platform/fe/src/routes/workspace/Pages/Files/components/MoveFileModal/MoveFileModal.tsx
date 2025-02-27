import React, { FC, useState } from "react";
import axios from "axios";
import { message } from "antd";

import { Modal, Button } from "@workspace/components";
import { My, Cooperation } from "@workspace/components/icon";
import { ModalInjectedProps, User, FileData } from "@workspace/types";
import FilesMenuTree from "./FilesMenuTree";

import css from "./MoveFileModal.less";

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
    const { id, groupId } = targetFile;

    if ((!id && !file.groupId && !file.parentId) || file.parentId ? file.parentId === id : file.groupId === id) {
      message.error("已在当前位置，无法移动");
    } else {
      setLoading(true);
      const data: any = {
        fileId: file.id,
      }
      if (id) {
        const isGroup = typeof groupId === 'undefined';
        if (isGroup) {
          data.toGroupId = id
        } else {
          data.toFileId = id
        }
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
      <Modal.Body className={css.body}>
        {user.id === Number(file.creatorId) && <FilesMenuTree
          icon={My}
          name={"我的"}
          file={{ id: 0 } as FileData}
          moveFile={file}
          targetFile={targetFile}
          onChange={setTargetFile}
          getFiles={async (file) => {
            const files = (await axios.get("/paas/api/file/getMyFiles", {
              params: {
                userId: user.id,
                extNames: "folder",
                parentId: file?.id || null
              }
            })).data.data;
            
            return files;
          }}
        />}
        <FilesMenuTree
          icon={Cooperation}
          clickable={false}
          moveFile={file}
          defaultOpen={true}
          targetFile={targetFile}
          name={"我加入的协作组"}
          getFiles={async (file) => {
            if (!file) {
              return (await axios.get("/paas/api/userGroup/getVisibleGroups", {
                params: {
                  userId: user.id
                }
              })).data.data;
            } else {
              const { groupId, extName, id } = file;
              const isGroup = !extName && id;

              const params = {
                userId: user.id,
                extNames: "folder",
                groupId: isGroup ? id : groupId,
                parentId: isGroup ? null : id
              }

              return (await axios.get("/paas/api/file/getGroupFiles", {
                params
              })).data.data;
            }
          }}
          onChange={setTargetFile}
        />
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
