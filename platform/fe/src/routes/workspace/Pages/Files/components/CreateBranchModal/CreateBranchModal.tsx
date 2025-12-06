import React, { FC, useEffect, useState } from "react";
import { Formik } from "formik";
import axios from "axios";
import { message, Select } from "antd";

import { Modal, Form, Input, Button } from "@workspace/components";
import { ModalInjectedProps, User, FileData } from "@workspace/types";
import { unifiedTime } from "@workspace/utils/time";

import css from "./CreateBranchModal.less";

interface CreateBranchModalProps extends ModalInjectedProps {
  user: User;
  file: FileData;
  next: (file: FileData) => void;
}

interface RenameFileValues {
  name: string;
  type: string;
  fileContentId: string;
}

const CreateBranchModal: FC<CreateBranchModalProps> = ({
  user,
  file,
  next,
  hideModal
}) => {

  const [typeMap, setTypeMap] = useState(null);
  const [versions, setVersions] = useState(null);

  useEffect(() => {
    axios.get("paas/api/workspace/publish/versions", {
      params: {
        fileId: file.id,
        pageSize: 100,
        pageIndex: 1
      }
    }).then(({ data }) => {
      if (data.code === 1) {
        const typeMap = {};

        if (data.data.length) {
          data.data.forEach((item) => {
            if (item.type) {
              if (!typeMap[item.type]) {
                typeMap[item.type] = [item]
              } else {
                typeMap[item.type].push(item)
              }
            }
          })
  
          setTypeMap(typeMap)
        }

        
        console.log("[typeMap]", typeMap)
      } else {
        message.error(`获取发布记录失败(${data.msg})`);
      }
    })
  }, [])

  return (
    <Modal title="创建分支">
      <Formik<RenameFileValues>
        initialValues={{ name: "", type: null, fileContentId: null }}
        validate={values => {
          let errors = {} as RenameFileValues;
          if (!values.name.trim()) {
            errors.name = "分支名不允许为空";
          }
          if (typeMap) {
            if (!values.type) {
              errors.type = "请选择环境";
            }
            if (!values.fileContentId) {
              errors.fileContentId = "请选择版本";
            }
          }
          return errors;
        }}
        onSubmit={async (values) => {
          console.log("user", user)
          console.log("file", file)
          console.log("values", values)
          const name = `${file.name}-${values.name}`
          const response = (await axios.post("/paas/api/file/createBranch", {
            fileId: file.id,
            fileContentId: values.fileContentId,
            userId: user.id,
            name,
            branchName: values.name,
          })).data;

          console.log("[response]", response)

          if (response.code === 1) {
            message.success("创建分支成功");
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
            message.error(`创建分支失败(${response.msg})`);
          }
        }}  
      >
        {({
          values,
          isValid,
          isSubmitting,
          submitForm,
          handleChange,
          setFieldValue
        }) => {
          const handleTypeChange = (value: string) => {
            setFieldValue('type', value);
            setVersions(typeMap[value]);
            setFieldValue('fileContentId', null);
          }

          const handleVersionChange = (value: string) => {
            setFieldValue('fileContentId', value);
          }

          return (
            <>
              <Modal.Body>
                <Form.Field label="分支名" className={css.formField}>
                  <Input
                    name="name"
                    placeholder="请输入分支名"
                    value={values.name}
                    onChange={handleChange}
                    error={!isValid}
                    autoFocus
                  />
                </Form.Field>
                {typeMap && <Form.Field label="环境" className={css.formField}>
                  <Select
                    style={{ width: "100%" }}
                    placeholder="请选择环境"
                    value={values.type}
                    onChange={handleTypeChange}
                    options={Object.keys(typeMap).map((key) => {
                      return {
                        label: key,
                        value: key
                      }
                    })}
                  />
                </Form.Field>}
                {versions && <Form.Field label="发布版本" className={css.formField}>
                  <Select
                    style={{ width: "100%" }}
                    placeholder="请选择发布版本"
                    value={values.fileContentId}
                    onChange={handleVersionChange}
                    options={versions.map(({ version, fileContentId}) => {
                      return {
                        label: version,
                        value: fileContentId
                      }
                    })}
                  />
                </Form.Field>}
              </Modal.Body>
              <Modal.Footer>
                <Button disabled={isSubmitting} onClick={hideModal}>
                  取 消
                </Button>
                <Button
                  type="primary"
                  onClick={submitForm}
                  disabled={!isValid || !values.name}
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

export default CreateBranchModal;
