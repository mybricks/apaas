import React, { FC, Fragment } from "react";

import { useLocationConetxt } from "@/context";
import Header from "./components/Header";
import Page from "./components/Page";
import Account from "@/Pages/Account";
import OperationLog from "@/Pages/OperationLog";
import UserManagement from "@/Pages/UserManagement";

import css from "./index.less";

const CONTENT_MAP: {[key: string]: {
  header: FC,
  page: FC,
  provider?: FC
}} = {
  [Account.id]: Account,
  [OperationLog.id]: OperationLog,
  [UserManagement.id]: UserManagement
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
