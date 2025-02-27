import React, { CSSProperties, FC, Fragment } from "react";

import { useWorkspaceConetxt, useAppRouterContext } from "@workspace/context";
import Header from "./components/Header";
import Page from "./components/Page";
import SharedWithAll from "@workspace/Pages/SharedWithAll";
import Material from "@workspace/Pages/Material";
import Trash from "@workspace/Pages/Trash";
import Files from "@workspace/Pages/Files";
import Account from "@workspace/Pages/Account";
import AppStore from "@workspace/Pages/AppStore";
// import OperationLog from "@workspace/Pages/OperationLog";
import UserManagement from "@workspace/Pages/UserManagement";
// import StaticFiles from "@workspace/Pages/StaticFiles";
import Settings from "@workspace/Pages/Settings";
import InstalledApp from "@workspace/Pages/InstalledApp";
import PageNotFound from "@workspace/Pages/PageNotFound";
import Website from "@workspace/Pages/Website";
import Tools from "@workspace/Pages/Tools";

import css from "./Content.less";

const CONTENT_MAP: {[key: string]: {
  header: FC,
  page: FC,
  provider?: FC
  pageStyle?: CSSProperties
}} = {
  [SharedWithAll.id]: SharedWithAll,
  [Material.id]: Material,
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
