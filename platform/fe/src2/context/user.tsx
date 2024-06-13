import React, { FC, createContext, ReactNode, useState, useContext, PropsWithChildren } from "react";
import axios from "axios";
import { message } from "antd";

import { removeCookie } from "@/utils/local";

export interface User {
  id: number;
  name: string | null;
  email: string;
  licenseCode: null;
  createTime: string;
  updateTime: string;
  status: number;
  role: number;
  avatar: string;
  isAdmin: boolean;
}

export function initUser(): Promise<User> {
  return new Promise(async (resolve) => {
    const response = (await axios.post('/paas/api/user/signed', {})).data;
    
    if (response.code !== 1) {
      message.warning(response.msg || '登录信息已过期，请重新登录', 2)
      setTimeout(() => {
        if(location.href.indexOf('jumped') === -1) {
          removeCookie('mybricks-login-user')
          location.href = `/?jumped=true&redirectUrl=${encodeURIComponent(location.href)}`
        }
      }, 2000)
    } else {
      const user = response.data;

      if (user.isAdmin) {
        // 管理员打开上报平台数据
        axios.post("/paas/api/system/channel", {
          type: 'connect',
          userId: user.id
        })
      }

      resolve(user);
    }
  })
}

interface UserContext {
  user: User;
  setUser: ({ name }: { name: string }) => void;
}

const userContext = createContext<UserContext>({} as UserContext);

interface UserProviderProps extends PropsWithChildren {
  value: User;
}

export const UserProvider: FC<UserProviderProps> = ({ value, children }) => {
  const [user, setUser] = useState(value);

  const handleSetUser = ({ name }: { name: string }) => {
    setUser({
      ...user,
      name
    })
  }

  return (
    <userContext.Provider value={{ user, setUser: handleSetUser }}>
      {children}
    </userContext.Provider>
  );
}

export const useUserContext = () => {
  return useContext(userContext);
}
