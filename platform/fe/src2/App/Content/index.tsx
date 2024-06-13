import React, { FC } from "react";

import { useLocationConetxt } from "@/context";
import Header from "./components/Header";
import Page from "./components/Page";
import { AccountHeader, AccountPage, id as AccountID } from "@/Pages/Account";

import css from "./index.less";

const HEADER_MAP = {
  [AccountID]: AccountHeader
}

const PAGE_MAP = {
  [AccountID]: AccountPage
}

const Content: FC = () => {
  const { params: { appId, parentId, groupId } } = useLocationConetxt();

  const HeaderChild = HEADER_MAP[appId];
  const PageChild = PAGE_MAP[appId];

  return (
    <div className={css.content}>
      <Header>
        {HeaderChild && <HeaderChild />}
      </Header>
      <Page>
        {PageChild && <PageChild />}
      </Page>
    </div>
  )
}

export default Content;
