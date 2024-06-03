import React, { useCallback, useState } from 'react'
import { Button, Input, message } from 'antd';
import axios from 'axios';
import { getApiUrl } from '@/utils';

const { TextArea } = Input;

export default function Diagnostics() {
  const [isDiagnosticsing, setIsDiagnosticsing] = useState(false)
  const [diagnosticsResult, setDiagnosticsResult] = useState('')

  const doDiagnostics = useCallback(() => {
    setIsDiagnosticsing(true)
    setDiagnosticsResult('')
    let result = ''
    try {
      axios.post(getApiUrl('/paas/api/system/diagnostics'), { action: 'init' })
      .then(({ data }) => {
        if(data.code === 1) {
          result += `${new Date().toLocaleTimeString()}：诊断服务链接成功\n`;
          return axios.post(getApiUrl('/paas/api/system/diagnostics'), { action: 'envCheck' })
        } else {
          result += `${new Date().toLocaleTimeString()}：诊断服务链接失败：\n${data.msg}\n`;
          setDiagnosticsResult(result)
        }
      }).then(({ data }) => {
        if(data.code === 1) {
          result += `${new Date().toLocaleTimeString()}：运行环境检测: ：运行环境检测成功！\n`;
          result += `${new Date().toLocaleTimeString()}：${data.msg}\n`;
          setDiagnosticsResult(result)
        } else {
          result += `${new Date().toLocaleTimeString()}：运行环境检测失败：\n${data.msg}\n`;
          setDiagnosticsResult(result)
        }
      }).finally(() => {
        setIsDiagnosticsing(false)
      })
      
    } catch(e) {
      message.warn(e)
    }
  }, [])

  return (
    <div>
      <div style={{display: 'flex'}}>
        <span style={{width: 100}}>诊断结果：</span>
        <TextArea value={diagnosticsResult} style={{resize: 'none'}} disabled={true} allowClear={false} rows={7} placeholder="诊断结果即将展示在此" maxLength={6} />
      </div>
      <div style={{display: 'flex', justifyContent: 'center', marginTop: 8}}>
        <Button loading={isDiagnosticsing} onClick={doDiagnostics}>开始诊断</Button>
      </div>
    </div>
  )
}