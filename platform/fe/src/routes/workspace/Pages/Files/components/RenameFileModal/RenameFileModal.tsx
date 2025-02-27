import React, { FC } from "react";
import { Formik } from "formik";
import axios from "axios";
import { message } from "antd";

import { Modal, Form, Input, Button } from "@workspace/components";
import { ModalInjectedProps, User, FileData } from "@workspace/types";

import css from "./RenameFileModal.less";

interface RenameFileModalProps extends ModalInjectedProps {
  user: User;
  file: FileData;
  next: (file: FileData) => void;
}

interface RenameFileValues {
  name: string;
}

const RenameFileModal: FC<RenameFileModalProps> = ({
  user,
  file,
  next,
  hideModal
}) => {
  return (
    <Modal title="重命名">
      <Formik<RenameFileValues>
        initialValues={{ name: file.name }}
        validate={values => {
          let errors = {} as RenameFileValues;
          if (!values.name.trim()) {
            errors.name = "名称不允许为空";
          }
          return errors;
        }}
        onSubmit={async (values) => {
          const { name } = values;
          await axios.post("/paas/api/file/rename", {
            id: file.id,
            userId: user.id,
            name
          });
          message.success("重命名成功");
          next({
            ...file,
            name
          });
          hideModal();
        }}  
      >
        {({
          values,
          dirty,
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
                  disabled={!dirty || !isValid}
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

export default RenameFileModal;
