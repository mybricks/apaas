import React, { FC } from "react";
import { message } from "antd";
import axios from "axios";
import { Formik } from "formik";

import { Button, Input, Form } from "@/components";
import { useUserContext } from "@/context";

import css from "./AccountPage.less";

interface AccountFormValues {
  name: string;
}

const FormFiled = Form.Field;

const AccountPage: FC = () => {
  const { user: { id, avatar, name }, setUser } = useUserContext();

  return (
    <div className={css.account}>
      <div className={css.form}>
        <div className={css.item}>
          <div className={css.avatar}>
            <img src={avatar}/>
          </div>
          <Formik<AccountFormValues>
            initialValues={{ name }}
            validate={values => {
              let errors = {} as AccountFormValues;
              if (!values.name.trim()) {
                errors.name = "用户名不允许为空";
              }
              return errors;
            }}
            onSubmit={async (values) => {
              const { name } = values;
              const response = (await axios.post("/paas/api/user/setUserInfo", {
                userId: id,
                name
              })).data;

              if (response.code === 1) {
                setUser({name});
                message.success("个人设置已更新");
              } else {
                message.error(response.msg);
              }
            }}
            enableReinitialize
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
                  <FormFiled label="用户名" className={css.input}>
                    <Input
                      name="name"
                      placeholder="请输入用户名"
                      value={values.name}
                      onChange={handleChange}
                      error={!isValid}
                    />
                  </FormFiled>
                  <Button
                    onClick={submitForm}
                    disabled={!dirty || !isValid}
                    loading={isSubmitting}
                  >
                    保 存
                  </Button>
                </>
              )
            }}
          </Formik>
        </div>
      </div>
    </div>
  )
}

export default AccountPage;
