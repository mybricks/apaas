import axios from "axios";
import { message } from "antd";

import { User, FileData  } from "@workspace/types";


interface ConfirmTouristVisitModalProps {
  user: User;
  file: FileData;
  touristVisit: boolean;
  next: () => void;
}

const ConfirmTouristVisitModal = ({ file, user, touristVisit, next }: ConfirmTouristVisitModalProps) => {
  return {
    title: `确认是否${touristVisit ? "开放" : "取消"}“${file.name}”的游客可访问权限`,
    onOk() {
      return new Promise(async (resolve, reject) => {
        const response = (await axios.post(touristVisit ? "/paas/api/file/share/mark" : "/paas/api/file/share/unmark", {
          id: file.id,
          userId: user.id,
          type: "touristVisit"
        })).data;
        
        if (response.code === 1) {
          const shareType = file.shareType || 0;
          if (touristVisit) {
            file.shareType = shareType + 10;
          } else {
            file.shareType = shareType - 10;
          }
          next();
          message.success(`${touristVisit ? "开放" : "取消"}游客访问权限成功`);
          resolve(response);
        } else {
          message.success(`${touristVisit ? "开放" : "取消"}游客访问权限失败(${response.msg})`);
          reject(response);
        }
      })
    }
  }
}

export default ConfirmTouristVisitModal;
