import axios from "axios";
import { message } from "antd";

import { Modal } from "@/components";
import { ModalInjectedProps, User, FileData  } from "@/types";


interface ConfirmDeleteModalProps {
  user: User;
  file: FileData;
  next: () => void;
}

const ConfirmDeleteModal = ({ file, user, next }: ConfirmDeleteModalProps) => {
  return {
    title: `确认是否删除“${file.name}”`,
    onOk() {
      return new Promise(async (resolve, reject) => {
        const response = (await axios.post("/paas/api/workspace/deleteFile", {
          id: file.id,
          userId: user.id
        })).data;
        
        if (response.code === 1) {
          next();
          message.success("删除成功");
          resolve(response);
        } else {
          message.success(`删除失败(${response.message})`);
          reject(response);
        }
      })
    }
  }
  // return Modal.Confirmation({
  //   hideModal,
  //   title: "",
  //   onOk() {
  //     // return new Promise(async (resolve, reject) => {
  //     //   const response = (await axios.post("/paas/api/workspace/deleteFile", {
  //     //     id: file.id,
  //     //     userId: user.id
  //     //   })).data;
        
  //     //   if (response.code === 1) {
  //     //     refresh({ file, type: "delete" });
  //     //     message.success("删除成功");
  //     //     resolve(response);
  //     //   } else {
  //     //     message.success(`删除失败(${response.message})`);
  //     //     reject(response);
  //     //   }
  //     // })
  //   }
  // })
}

export default ConfirmDeleteModal;
