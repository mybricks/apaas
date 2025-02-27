import axios from "axios";
import { message } from "antd";

import { User, FileData  } from "@workspace/types";


interface ConfirmShareModalProps {
  user: User;
  file: FileData;
  share: boolean;
  next: () => void;
}

const ConfirmShareModal = ({ file, user, share, next }: ConfirmShareModalProps) => {
  return {
    title: share ? `确认是否将“${file.name}”分享至大家的分享` : `确认是否取消分享“${file.name}”`,
    onOk() {
      return new Promise(async (resolve, reject) => {
        const response = (await axios.post(share ? "/paas/api/file/share/mark" : "/paas/api/file/share/unmark", {
          id: file.id,
          userId: user.id,
          type: "share"
        })).data;
        
        if (response.code === 1) {
          const shareType = file.shareType || 0;
          if (share) {
            file.shareType = shareType + 1;
          } else {
            file.shareType = shareType - 1;
          }
          next();
          message.success(share ? "分享成功" : "取消分享成功");
          resolve(response);
        } else {
          message.success(`${share ? "分享" : "取消分享"}失败(${response.msg})`);
          reject(response);
        }
      })
    }
  }
}

export default ConfirmShareModal;
