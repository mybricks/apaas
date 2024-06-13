import React, { FC, useEffect, useState } from "react";
import { ConfigProvider, Skeleton } from "antd";
import classNames from "classnames";
import { BrowserRouter } from "react-router-dom";

import Sidebar from "./Sidebar";
import Content from "./Content";
import { AppContextProvider, initContext } from "@/context";
import { App as AppContext } from "@/types";

import css from "./index.less";

const App: FC = () => {
  const [appContextValue, setAppContextValue] = useState<AppContext>(null);

  useEffect(() => {
    // 数据初始化
    initContext().then(setAppContextValue);
  }, [])

  const render = () => {
    if (!appContextValue) {
      // TODO: 初始化等待时展示骨架屏，后续去除
      return <Skeleton active/>
    } else {
      const { user, system } = appContextValue;
      const { openSystemWhiteList } = system;

      if (openSystemWhiteList && user.role > 1 || !openSystemWhiteList) {
        return (
          <BrowserRouter>
            <ConfigProvider
              theme={{
                token: {
                  colorPrimary: "#f26726d9",
                },
              }}
            >
              <AppContextProvider value={appContextValue}>
                <Sidebar />
                <Content />
              </AppContextProvider>
            </ConfigProvider>
          </BrowserRouter>
        )
      }

      return <span>抱歉，暂无权限访问，请联系官方团队</span>
    }
  }

  return (
    <div className={classNames(css.app, {[css.loading]: !appContextValue})}>
      {render()}
    </div>
  );
}

export default App;
