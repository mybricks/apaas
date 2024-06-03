import React, { useCallback, useEffect, useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import axios from 'axios'
import { getApiUrl } from '@/utils'
import { solarizedLight } from '@uiw/codemirror-theme-solarized'
import { json } from '@codemirror/lang-json'
import { hyperLink, hyperLinkExtension } from '@uiw/codemirror-extensions-hyper-link'
import { Button, Form, Input, InputNumber, Switch, message } from 'antd'
import css from './index.less'

const extensions = [
  json(),
  hyperLink,
  hyperLinkExtension({
    regexp: /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi
  })
]
const basicSetup = {
  crosshairCursor: false
}

export default function () {
  const [log, setLog] = useState('')
  const [isShowShortcatKeyTip, SetIsShowShortcatKeyTip] = useState(false)
  const [isRealtimeRefresh, setIsRealtimeRefresh] = useState(false)
  const codeMirrorRef = useRef(null)
  const toolbarRef = useRef(null)
  const [fullScreenHeight, setFullScreenHeight] = useState('')
  const [line, setLine] = useState(100)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [form] = Form.useForm()
  const [isError, setIsError] = useState(false)
  const [countdown, setCountdown] = useState(10)

  const getLogStr = useCallback(
    async (str?: string) => {
      return new Promise((resolve) => {
        axios.post(getApiUrl('/paas/api/log/runtimeLog/search'), { searchValue: str, line }).then(({ data }) => {
          if (data.code === 1) {
            setIsError(false)
            resolve(data.data)
          } else {
            setIsError(true)
          }
        }).catch(() => {
          setIsError(true)
        })
      })
    },
    [line]
  )

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      codeMirrorRef.current.view.scrollDOM.scrollTo({
        top: codeMirrorRef.current.view.scrollDOM.scrollHeight
      })
    }, 50)
  }, [codeMirrorRef])

  const refresh = useCallback(
    (str?: string) => {
      getLogStr(str).then((res) => {
        setLog(res?.content || '')
        message.success('刷新成功', 2)
        scrollToBottom()
      })
    },
    [line, scrollToBottom]
  )

  useEffect(() => {
    let timer: NodeJS.Timeout
    let countdown: number
    const interval = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        countdown--
        if (countdown === 0) {
          countdown = 10
          refresh()
        }
        setCountdown(countdown)
        interval()
      }, 1000)
    }
    if (isRealtimeRefresh) {
      countdown = 10
      setCountdown(countdown)
      refresh()
      interval()
    }
    return () => {
      clearTimeout(timer)
      timer = null
    }
  }, [isRealtimeRefresh, refresh])

  useEffect(() => {
    getLogStr().then((res) => {
      setLog(res?.content || '')
    })
  }, [])

  const calcFullScreenHeight = useCallback(() => {
    if (isFullScreen) {
      const toolbarStyle = window.getComputedStyle(toolbarRef.current)
      const marginTop = parseFloat(toolbarStyle.getPropertyValue('margin-top'))
      const marginBottom = parseFloat(toolbarStyle.getPropertyValue('margin-bottom'))
      setFullScreenHeight(`${window.innerHeight - toolbarRef.current.clientHeight - marginTop - marginBottom}px`)
    }
  }, [isFullScreen, toolbarRef])

  useEffect(() => {
    calcFullScreenHeight()
  }, [calcFullScreenHeight])

  const handleUpdate = useCallback(() => {
    SetIsShowShortcatKeyTip(codeMirrorRef?.current?.view?.hasFocus)
  }, [codeMirrorRef])

  useEffect(() => {
    window.addEventListener('resize', calcFullScreenHeight)
    return () => {
      window.removeEventListener('resize', calcFullScreenHeight)
    }
  }, [calcFullScreenHeight])

  return (
    <div className={`${css.container} ${isFullScreen ? css.fullScreen : ''}`}>
      <div ref={toolbarRef} className={`${css.toolbar} ${isFullScreen ? css.fullScreen : ''}`}>
        <Form
          layout={'inline'}
          form={form}
          onFinish={(values) => {
            refresh(values.searchValue)
          }}
        >
          <Form.Item label='搜索内容' name='searchValue'>
            <Input placeholder='搜索内容' allowClear />
          </Form.Item>
          <Form.Item>
            <Button type='primary' htmlType='submit'>
              查询
            </Button>
          </Form.Item>
        </Form>
        <div className={css.config}>
          <div className={css.line}>
            <InputNumber
              className={css.lineInput}
              size='small'
              step={50}
              max={1000}
              defaultValue={100}
              onChange={(val) => {
                setLine(val)
              }}
            />
            <span className={css.lineLabel}>行</span>
          </div>
          <div className={css.refresh} onClick={() => refresh()}>立即刷新</div>
          <Switch
            onChange={(e) => {
              setIsRealtimeRefresh(e)
            }}
            checkedChildren={`实时刷新(${countdown}S)`}
            unCheckedChildren='实时刷新'
          />
          <div
            className={css.fullScreen}
            onClick={() => {
              setIsFullScreen((pre) => !pre)
            }}
          >
            {isFullScreen ? (
              <svg
                t='1695125520472'
                class='icon'
                viewBox='0 0 1024 1024'
                version='1.1'
                xmlns='http://www.w3.org/2000/svg'
                p-id='4171'
                width='25'
                height='25'
              >
                <path
                  d='M747.90557837 646.7890625h101.10662843c9.31420898 0 17.25402856 3.29754663 23.82934617 9.88769508 6.60992408 6.59509253 9.89758325 14.52502465 9.89758253 23.79968309 0 9.37353516-3.28765845 17.30346656-9.90252662 23.8985591-6.57037354 6.59014916-14.51019311 9.88769508-23.82440208 9.88769578h-101.10168434c-9.30432153 0-17.25402856 3.29754663-23.82934546 9.88769508-6.60992408 6.59509253-9.88769508 14.52502465-9.88769579 23.794739v101.1610105c0 9.26971435-3.29754663 17.20458984-9.89758254 23.79473901-6.58026099 6.59014916-14.52502465 9.88769508-23.82934617 9.88769508-9.29443336 0-17.25897193-3.29754663-23.80956984-9.88769508-6.62475562-6.59509253-9.89758325-14.52502465-9.89758325-23.79473901v-101.1610105c0-27.91296386 9.85803199-51.71264625 29.61364723-71.48803711 19.74572778-19.77539086 43.55529761-29.56420922 71.48309374-29.56420922l0.04943799-0.09887672zM343.46917724 141.21142578c9.3092649 0 17.25897193 3.29754663 23.8244021 9.88769508 6.60992408 6.59509253 9.89758325 14.52502465 9.89758253 23.79473901v101.1610105c0 27.91296386-9.87780761 51.71264625-29.62353468 71.48803711-19.74572778 19.77539086-43.58001733 29.66308594-71.4929812 29.66308594H174.96307349c-9.29443336 0-17.25402856-3.29260253-23.82440138-9.98657179-6.60992408-6.49127173-9.88769508-14.42120385-9.88769578-23.79473902 0-9.27465844 3.27777099-17.20458984 9.88769578-23.79968238 6.57531762-6.59014916 14.52502465-9.88769508 23.82934547-9.88769578h101.10168433c9.31420898 0 17.25402856-3.29754663 23.82934618-9.88769508 6.60992408-6.59509253 9.89758325-14.52502465 9.89758254-23.794739V174.89385987c0-9.26971435 3.27282691-17.30346656 9.89758324-23.79473901 6.57531762-6.69396997 14.51513648-9.88769508 23.81451392-9.88769508h-0.03955055zM174.96307349 646.7890625H276.07959008c27.91296386 0 51.74725342 9.88769508 71.48803711 29.66803002 19.75067115 19.67651344 29.62847876 43.57507324 29.62847877 71.48803711v101.05224562c0 9.37847924-3.28765845 17.30841065-9.89758325 23.90350389-6.56542945 6.59014916-14.51513648 9.88769508-23.82934547 9.88769508-9.29443336 0-17.25402856-3.29754663-23.80957054-9.88769508-6.62475562-6.59509253-9.90252662-14.52502465-9.90252662-23.8985598v-101.05224634c0-9.37847924-3.28271508-17.30841065-9.90747071-23.79968237-6.56048608-6.69396997-14.50030493-9.9865725-23.82440209-9.9865725H174.91857886c-9.30432153 0-17.25402856-3.1986692-23.819458-9.89263917-6.60992408-6.49127173-9.88769508-14.52502465-9.88769508-23.79473829 0-9.27465844 3.27777099-17.30346656 9.88769508-23.79968309 6.56048608-6.69396997 14.51513648-9.88769508 23.81451463-9.88769508h0.049438zM680.51104712 141.21142578c9.31420898 0 17.26391602 3.29754663 23.82934618 9.88769508 6.60992408 6.59509253 9.89263916 14.52502465 9.89263917 23.79473901v101.1610105c0 9.26971435 3.28765845 17.30346656 9.90252661 23.794739 6.56048608 6.69396997 14.52008057 9.88769508 23.82440209 9.88769508h101.09674025c9.3092649 0 17.26391602 3.29754663 23.82934618 9.88769578 6.6049807 6.59509253 9.90252662 14.52502465 9.90252662 23.8985591 0 9.27465844-3.29754663 17.20458984-9.89758325 23.79968309-6.57531762 6.59014916-14.52502465 9.88769508-23.83428955 9.88769508h-101.10168433c-27.92285133 0-51.72253442-9.88769508-71.48803711-29.56420922-19.76055932-19.77539086-29.61364722-43.57507324-29.61364722-71.48803711V174.99273657c0-9.37353516 3.28271508-17.30346656 9.88769507-23.79473829 6.57037354-6.69396997 14.53491211-9.88769508 23.82934546-9.88769578L680.51599121 141.21142578z'
                  p-id='4172'
                  fill='#8a8a8a'
                ></path>
              </svg>
            ) : (
              <svg
                t='1695125052661'
                class='icon'
                viewBox='0 0 1024 1024'
                version='1.1'
                xmlns='http://www.w3.org/2000/svg'
                p-id='3879'
                width='25'
                height='25'
              >
                <path
                  d='M849.07153297 646.81872559c9.30432153 0 17.26391602 3.30249 23.82934617 9.88769507 6.60992408 6.59509253 9.88769508 14.52502465 9.88769508 23.79473901v101.14617896c0 27.90801978-9.87780761 51.70275879-29.61364722 71.47814965-19.75067115 19.77539086-43.56518578 29.66308594-71.48803711 29.66308594h-101.1165166c-9.32409644 0-17.25402856-3.29754663-23.83428954-9.9865725-6.59509253-6.49127173-9.90252662-14.52502465-9.90252662-23.7947383 0-9.26971435 3.30743408-17.20458984 9.90252662-23.79473901 6.58026099-6.59014916 14.51019311-9.88769508 23.83428954-9.88769507h101.1165166c9.29937744 0 17.26391602-3.29754663 23.82440137-9.88769579 6.61486816-6.59014916 9.88769508-14.52008057 9.88769579-23.89361573v-101.04235815c0-9.36859107 3.28765845-17.30346656 9.89758254-23.78979493 6.57531762-6.69396997 14.52502465-9.99151587 23.83923363-9.99151587l-0.06427025 0.09887671zM242.38726782 141.3103025h101.10168506c9.30432153 0 17.2688601 3.29754663 23.819458 9.88769578 6.62475562 6.59509253 9.89758325 14.52502465 9.89758254 23.7947383 0 9.37353516-3.27282691 17.30346656-9.89758254 23.79473901-6.5505979 6.69396997-14.51513648 9.9865725-23.81451463 9.9865725h-101.10168433c-9.31915307 0-17.2688601 3.19372583-23.82934547 9.88769508-6.62475562 6.49127173-9.91241479 14.52502465-9.91241479 23.794739v101.04235816c0 9.36859107-3.28271508 17.30346656-9.89758324 23.89361573-6.57531762 6.59014916-14.51513648 9.88769508-23.81451392 9.88769507-9.31420898 0-17.25402856-3.29754663-23.82934547-9.88769507C144.49908423 360.80230689 141.21142578 352.86743141 141.21142578 343.49884033V242.45648217c0-27.91296386 9.86792016-51.70275879 29.62353539-71.47814965 19.75067115-19.77539086 43.57507324-29.66308594 71.48803711-29.66308594h0.06426954zM174.9877932 646.81872559c9.30432153 0 17.24414039 3.30249 23.81451393 9.88769507 6.62475562 6.59509253 9.90252662 14.52502465 9.90252662 23.79473901v101.14617896c0 9.26971435 3.27282691 17.19964576 9.89758324 23.78979492 6.57531762 6.59014916 14.51513648 9.88769508 23.81451393 9.88769579h101.12640404c9.29937744 0 17.25402856 3.29754663 23.82934547 9.88769507 6.60992408 6.59014916 9.88769508 14.52502465 9.88769579 23.89361572 0 9.26971435-3.27777099 17.20458984-9.88769579 23.79473901-6.57531762 6.59014916-14.52996803 9.88769508-23.82934547 9.88769508H242.41693092c-27.91296386 0-51.71264625-9.88769508-71.47814895-29.66308594-19.75561523-19.67651344-29.62353539-43.57012915-29.62353539-71.47814965v-101.04235816c0-9.26971435 3.27282691-17.30346656 9.88769507-23.89361573 6.58026099-6.59509253 14.52502465-9.88769508 23.81451464-9.88769507h-0.02966309zM680.57037329 141.3103025h101.1165166c27.92285133 0 51.73736596 9.88769508 71.48803711 29.56420922 19.73583961 19.77539086 29.61364722 43.57012915 29.61364722 71.47814965v101.14617896c0 9.26971435-3.27777099 17.30346656-9.88769508 23.78979493-6.56542945 6.69396997-14.52502465 9.88769508-23.82934617 9.88769506-9.29937744 0-17.26391602-3.19372583-23.82440139-9.88769506-6.61486816-6.48632836-9.88769508-14.52008057-9.88769579-23.78979493V242.35266137c0-9.26971435-3.28765845-17.19964576-9.90252661-23.78979492-6.57037354-6.59509253-14.52008057-9.88769508-23.83428955-9.88769579h-101.10168433c-9.31420898 0-17.2688601-3.29754663-23.82934618-9.88769507-6.60992408-6.59509253-9.89758325-14.52502465-9.89758254-23.79473902 0-9.37353516 3.28765845-17.30346656 9.89758254-23.89361571 6.56048608-6.59014916 14.51513648-9.88769508 23.82934618-9.88769508l0.04943799 0.09887672z'
                  p-id='3880'
                  fill='#8a8a8a'
                ></path>
              </svg>
            )}
          </div>
        </div>
      </div>
      {
        isError ?
          <div className={css.error}>请求异常，请<p className={css.refresh} onClick={() => refresh()}>刷新</p>重试</div> :
          <div>
            <CodeMirror
              ref={codeMirrorRef}
              height={isFullScreen ? fullScreenHeight : '500px'}
              basicSetup={basicSetup}
              readOnly
              value={log}
              theme={solarizedLight}
              autoFocus
              extensions={extensions}
              onCreateEditor={scrollToBottom}
              onUpdate={handleUpdate}
            />
            {isShowShortcatKeyTip && (
              <div className={`${css.shortcatKeyTip} ${isFullScreen ? css.fullScreen : ''}`}>command/Ctrl + F 开启面板搜索</div>
            )}
          </div>
      }
    </div>
  )
}
