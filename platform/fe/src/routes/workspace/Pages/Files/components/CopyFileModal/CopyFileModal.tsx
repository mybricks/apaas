import React, { FC } from "react";
import { Formik } from "formik";
import axios from "axios";
import { message } from "antd";

import { Modal, Form, Input, Button } from "@workspace/components";
import { ModalInjectedProps, User, FileData } from "@workspace/types";
import { unifiedTime } from "@workspace/utils/time";

import css from "./CopyFileModal.less";

interface CopyFileModalProps extends ModalInjectedProps {
  user: User;
  file: FileData;
  next: (file: FileData) => void;
}

interface RenameFileValues {
  name: string;
}

const CopyFileModal: FC<CopyFileModalProps> = ({
  user,
  file,
  next,
  hideModal
}) => {
  return (
    <Modal title="创建副本">
      <Formik<RenameFileValues>
        initialValues={{ name: `${file.name}(副本)` }}
        validate={values => {
          let errors = {} as RenameFileValues;
          if (!values.name.trim()) {
            errors.name = "名称不允许为空";
          }
          return errors;
        }}
        onSubmit={async (values) => {
          const { name } = values;
          const response = (await axios.post("/paas/api/file/copy", {
            id: file.id,
            userId: user.id,
            name
          })).data;

          if (response.code === 1) {
            message.success("创建副本成功");
            const _createTime = new Date().getTime();
            const createTime = unifiedTime(_createTime);
            next({
              ...file,
              id: response.data.id,
              shareType: null,
              description: null,
              _createTime,
              createTime,
              _updateTime: _createTime,
              updateTime: createTime,
              name,
              creatorId: user.id,
              creatorName: user.name,
            });
            hideModal();
          } else {
            message.error(`创建副本失败(${response.msg})`);
          }
        }}  
      >
        {({
          values,
          isValid,
          isSubmitting,
          submitForm,
          handleChange
        }) => {
          return (
            <>
              <Modal.Body>
                <Form.Field label="名称" className={css.formField}>
                  <Input
                    name="name"
                    placeholder="请输入新的名称"
                    value={values.name}
                    onChange={handleChange}
                    error={!isValid}
                    autoFocus
                  />
                </Form.Field>
              </Modal.Body>
              <Modal.Footer>
                <Button disabled={isSubmitting} onClick={hideModal}>
                  取 消
                </Button>
                <Button
                  type="primary"
                  onClick={submitForm}
                  disabled={!isValid}
                  loading={isSubmitting}
                >
                  确 认
                </Button>
              </Modal.Footer>
            </>
          )
        }}
      </Formik>
    </Modal>
  )
}

export default CopyFileModal;
