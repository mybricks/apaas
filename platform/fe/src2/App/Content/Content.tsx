import React, { FC, Fragment } from "react";

import { useLocationConetxt } from "@/context";
import Header from "./components/Header";
import Page from "./components/Page";
import SharedWithAll from "@/Pages/SharedWithAll";
import Trash from "@/Pages/Trash";
import Files from "@/Pages/Files";
import Account from "@/Pages/Account";
import AppStore from "@/Pages/AppStore";
import OperationLog from "@/Pages/OperationLog";
import UserManagement from "@/Pages/UserManagement";
import StaticFiles from "@/Pages/StaticFiles";
import Settings from "@/Pages/Settings";

import css from "./Content.less";

const CONTENT_MAP: {[key: string]: {
  header: FC,
  page: FC,
  provider?: FC
}} = {
  [SharedWithAll.id]: SharedWithAll,
  [Trash.id]: Trash,
  [Files.id]: Files,
  [Account.id]: Account,
  [AppStore.id]: AppStore,
  [OperationLog.id]: OperationLog,
  [UserManagement.id]: UserManagement,
  [StaticFiles.id]: StaticFiles,
  [Settings.id]: Settings
}

const Content: FC = () => {
  const { params: { appId, parentId, groupId } } = useLocationConetxt();

  const {
    header: HeaderView,
    page: PageView,
    provider: ProviderView = Fragment
  } = CONTENT_MAP[appId] || {};

  return (
    <div className={css.content}>
      <ProviderView>
        <Header>
          {HeaderView && <HeaderView />}
        </Header>
        <Page>
          {PageView && <PageView />}
        </Page>
      </ProviderView>
    </div>
  )
}

export default Content;
