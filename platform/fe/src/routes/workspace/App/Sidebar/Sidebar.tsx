import React, { FC } from "react";

import Header from "./components/Header";
import Content from "./components/Content";
import Footer from "./components/Footer";

import css from "./Sidebar.less";

const Sidebar: FC = () => {
  return (
    <aside className={css.sidebar}>
      <Header />
      <Content />
      <Footer />
    </aside>
  );
}

export default Sidebar;
