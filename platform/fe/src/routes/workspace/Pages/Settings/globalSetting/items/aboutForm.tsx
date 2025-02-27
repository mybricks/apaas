import React, {
} from 'react'
import {QuestionCircleOutlined, InboxOutlined, GlobalOutlined, ThunderboltOutlined, MessageOutlined, EnterOutlined, LoadingOutlined } from '@ant-design/icons'
import {
  Upload,
} from 'antd'
import { useUserContext } from '@workspace/context'
import styles from '../index.less'

const AboutTab = ({ currentPlatformVersion }) => {
  return (
    <>
       <div style={{display: 'flex', alignItems: 'center', flexDirection: 'column', padding: '10px 0', height: 100, justifyContent: 'space-around'}}>
        <p style={{textAlign: 'center'}}>当前版本是： <span style={{color: 'rgb(22, 119, 255)'}}>{currentPlatformVersion}</span></p>
       </div>
    </>
  )
}

const AboutForm = ({ currentPlatformVersion }) => {
  const user = useUserContext()

  return <AboutTab currentPlatformVersion={currentPlatformVersion}/>
}

export default AboutForm