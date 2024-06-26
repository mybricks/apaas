import axios from 'axios'
import React, { useEffect, useState, useRef } from 'react'
import { Modal, Button } from 'antd'
import { Icon } from '@/components/icon';
import { useWorkspaceConetxt } from '@/context';

import css from "./index.less";

const PageChooseModal = props => {
  const { apps: { getApp } } = useWorkspaceConetxt();
  const { extName, onChoose, onCancel, onOk, modalVisible } = props;
  // const [templateList, setTemplateList] = useState([]);
  const [pageList, setPageList] = useState([])
  const [currentHoverIndex, setCurrentHoverIndex] = useState(-1);
  const app = getApp(extName)

  useEffect(() => {
    axios.post('/paas/api/share/getAll', {
      extName: extName,
      page: 0,
      pageSize: 1000,
      onlyPublished: 1,
    })
      .then(({ data }) => {
        if (data.code === 1) {
          setPageList(data.data?.list ?? [])
        }
      })

  }, []);

  return (
    <>
      <Modal
        open={modalVisible}
        title="模板页面选择"
        destroyOnClose
        width={942}
        onCancel={onCancel}
        footer={[
          <Button key="cancel" onClick={onCancel}>
            取消
          </Button>
        ]}
      >
        {/* display: 'flex', flexFlow: 'wrap' */}
        <div style={{ maxHeight: 716, overflow: 'auto' }}>
          {
            pageList?.map(template => {
              return (
                <TemplateItem
                  template={template}
                  appReg={app}
                  currentHoverIndex={currentHoverIndex}
                  setCurrentHoverIndex={setCurrentHoverIndex}
                  onChoose={onChoose}
                />
              )
            })
          }
        </div>
      </Modal>
    </>
  )
};

function TemplateItem({ template, appReg, currentHoverIndex, setCurrentHoverIndex, onChoose }) {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        position: 'relative',
        cursor: 'pointer',
        width: 208,
        height: 181,
        boxShadow: '0px 3px 5px 0px #1f23290a',
        borderRadius: 5,
        border: '1px solid #ebedf0',
        marginBottom: 20,
        marginRight: 10,
        display: 'inline-block',
        whiteSpace: 'nowrap'
      }}
      data-fileid={template.id}
      onMouseEnter={(e) => {
        const id = e.currentTarget.dataset.fileid;
        setCurrentHoverIndex(+id)
      }}
      onMouseLeave={(e) => {
        setCurrentHoverIndex(-1)
      }}
    >
      <div
        style={{
          padding: 6,
          height: '140px',
          backgroundColor: '#FAFAFA',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}
        className={template.icon ? css.largeIcon : css.icon}
      >
        <Icon icon={template.icon || appReg?.icon} />
      </div>
      <p
        style={{
          textAlign: 'center',
          fontWeight: 800,
          lineHeight: '30px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          padding: 5
        }}>
        {template.name}
      </p>
      {
        currentHoverIndex == template.id ?
          <div
            data-fileid={template.id}
            style={{
              position: 'absolute',
              left: 0, top: 0,
              width: '100%', height: '100%',
              backgroundColor: '#1f232980',
              alignItems: 'center',
              justifyContent: 'center',
              display: 'flex',
            }}
          >
            <Button type="primary" onClick={() => onChoose({ fileId: template.id, title: template.name })}>
              使用
            </Button>
          </div>
          : null
      }
    </div>
  )
}

export default PageChooseModal;