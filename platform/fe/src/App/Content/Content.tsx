import React, { CSSProperties, FC, Fragment } from "react";

import { useWorkspaceConetxt, useAppRouterContext } from "@/context";
import Header from "./components/Header";
import Page from "./components/Page";
import SharedWithAll from "@/Pages/SharedWithAll";
import Trash from "@/Pages/Trash";
import Files from "@/Pages/Files";
import Account from "@/Pages/Account";
import AppStore from "@/Pages/AppStore";
// import OperationLog from "@/Pages/OperationLog";
import UserManagement from "@/Pages/UserManagement";
// import StaticFiles from "@/Pages/StaticFiles";
import Settings from "@/Pages/Settings";
import InstalledApp from "@/Pages/InstalledApp";
import PageNotFound from "@/Pages/PageNotFound";
import Website from "@/Pages/Website";
import Tools from "@/Pages/Tools";

import css from "./Content.less";

const CONTENT_MAP: {[key: string]: {
  header: FC,
  page: FC,
  provider?: FC
  pageStyle?: CSSProperties
}} = {
  [SharedWithAll.id]: SharedWithAll,
  [Trash.id]: Trash,
  [Files.id]: Files,
  [Account.id]: Account,
  [AppStore.id]: AppStore,
  // [OperationLog.id]: OperationLog,
  [UserManagement.id]: UserManagement,
  // [StaticFiles.id]: StaticFiles,
  [Settings.id]: Settings,
  [Website.id]: Website,
  [Tools.id]: Tools
}

const Content: FC = () => {
  const { apps: { getApp } } = useWorkspaceConetxt();
  const appId = useAppRouterContext();

  const {
    header: HeaderView,
    page: PageView = PageNotFound,
    provider: ProviderView = Fragment,
    pageStyle,
  } = CONTENT_MAP[appId] || (() => {
    const app = getApp(appId);
    if (app) {
      return {
        header: () => <InstalledApp.header {...app}/>,
        page: () => <InstalledApp.page {...app}/>
      }
    }
    return {}
  })() as typeof CONTENT_MAP[string];

  return (
    <div className={css.content}>
      <ProviderView>
        <Header>
          {HeaderView && <HeaderView />}
        </Header>
        <Page style={pageStyle}>
          {PageView && <PageView />}
        </Page>
      </ProviderView>
    </div>
  )
}

export default Content;
