import React, { FC, useState } from "react";
import { message } from "antd";
import axios from "axios";

import { Button, Input } from "@/components";
import { useUserContext } from "@/context";

import css from "./AccountPage.less";
const AccountPage: FC = () => {
  const { user: { id, avatar, name }, setUser } = useUserContext();
  const [nameSpinning, setNameSpinning] = useState(false);
  const [nameValue, setNameValue] = useState(name);
  const trimmedName = nameValue.trim();

  const handleNameSave = async () => {
    setNameSpinning(true);

    const response = (await axios.post("/paas/api/user/setUserInfo", {
      userId: id,
      name: trimmedName
    })).data;

    if (response.code === 1) {
      setUser({name: trimmedName});
      message.success("个人设置已更新");
      setNameValue(trimmedName);
    } else {
      message.error(response.msg);
    }

    setNameSpinning(false);
  }

  const handleNameChange = (value: string) => {
    setNameValue(value);
  }

  return (
    <div className={css.account}>
      <div className={css.title}>
        个人设置
      </div>
      <div className={css.form}>
        <div className={css.item}>
          <div className={css.avatar}>
            <img src={avatar}/>
          </div>
          <Input
            className={css.input}
            label="用户名"
            placeholder="请输入用户名"
            value={nameValue}
            onChange={handleNameChange}
            error={!trimmedName}
          />
          <Button
            onClick={handleNameSave}
            disabled={trimmedName === name || !trimmedName}
            loading={nameSpinning}
          >
            保 存
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AccountPage;
