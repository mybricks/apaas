// TODO: Next
import React, { useEffect, useMemo, useState } from 'react'
import {
  Select,
  Form,
  Input,
  Button,
  Table,
  Col,
  Row,
  Pagination,
  Modal,
  message,
} from 'antd'
import axios from 'axios'
import css from './ToolsPage.less'

import { useUserContext } from '@workspace/context'
import { useToolsContext } from './ToolsProvider'
import { Panels } from './panels'

import { IS_IN_BRICKS_ENV } from '@workspace/const'

export default function ToolsPage() {
  const { user } = useUserContext()

  const { activeTab, setActiveTab } = useToolsContext()

  const activePanel = useMemo(() => {
    return Panels.find((t) => t.key === activeTab)
  }, [activeTab])

  const visiblePanels = useMemo(() => {
    let filterPanels = Panels.filter(p => {
      if (!IS_IN_BRICKS_ENV) {
        return p.key !== 'monitor'
      }
      return true
    })

    return filterPanels.filter(p => {
      return !user.isAdmin ? !p.isAdmin : true
    })
  }, [user?.isAdmin])

  return (
    <div className={css.tools}>
      {activePanel ? (
        activePanel?.component
      ) : (
        <div className={css.panels}>
          {
            visiblePanels.filter(p => {
              return !user.isAdmin ? !p.isAdmin : true
            }).map(panel => {
              return (
                <div className={css.item} onClick={() => setActiveTab(panel.key)}>
                  {<panel.icon />}
                  <div className={css.label}>
                    {panel.title}
                  </div>
                </div>
              )
            })
          }
        </div>
      )}
    </div>
  )
}
