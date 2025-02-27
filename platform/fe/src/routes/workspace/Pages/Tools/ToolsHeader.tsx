import React, { FC, useMemo } from "react";
import { Breadcrumb } from 'antd';
import { Navbar } from "@workspace/components";
import { useToolsContext } from './ToolsProvider'

import { Panels } from './panels'

const ToolsHeader: FC = () => {
  const { setActiveTab, activeTab } = useToolsContext()

  const activePanel = useMemo(() => {
    return Panels.find(t => t.key === activeTab)
  }, [activeTab])

  const items = useMemo(() => {
    let arr = [
      {
        title: <a target="_blank">常用工具</a>,
        onClick: () => {
          setActiveTab('');
        }
      },
    ];

    if (activePanel) {
      arr.push({
        title: <a target="_blank">{activePanel?.title}</a>,
        onClick: () => {
          setActiveTab(activePanel.key)
        }
      })
    }

    return arr
  }, [activePanel])

  return (
    <Breadcrumb
      items={items}
    />
  )
}

export default ToolsHeader;
