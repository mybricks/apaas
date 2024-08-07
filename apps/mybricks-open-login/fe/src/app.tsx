import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  FC,
} from 'react'
import {Github, VScode} from './icons'
import {
  getApiUrl,
  getCookie,
  removeCookie,
  setCookie,
  getUrlQuery,
} from './utils'
import {COOKIE_LOGIN_USER} from './constants'
import axios from 'axios'

import {Message, Logo} from './components'

import css from './app.less'

const emailReg = /^[a-zA-Z\d.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z\d](?:[a-zA-Z\d-]{0,61}[a-zA-Z\d])?(?:\.[a-zA-Z\d](?:[a-zA-Z\d-]{0,61}[a-zA-Z\d])?)*$/

const checkCurrentIsLogin = async () => {
  return new Promise((resolve) => {
    axios
      .post('/paas/api/user/queryCurrentSession')
      .then(({data}) => {
        if (data.code === 1) {
          const {redirectUrl} = getUrlQuery()
          if (typeof redirectUrl === 'string') {
            location.href = decodeURIComponent(redirectUrl)
          } else {
            location.href = '/workspace.html'
          }
          resolve(true)
        } else if (data.code === -2) {
          Message.success(data?.message ?? '当前登录已失效，请重新登录', 5)
          // 当前账户在其他设备登录
          resolve(false)
        } else {
          resolve(false)
        }
      })
  })
}

export default function App() {
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  
  const [action, setAction] = useState({
    type: 'signin',
    buttonText: '登录',
    toggleText: '创建新账户',
  })
  
  const [errInfo, setErrInfo] = useState({
    type: '',
    message: '',
  })
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    captcha: '',
  })
  
  useEffect(async () => {
    try {
      await checkCurrentIsLogin()
    } catch (error) {
      
    }
    setLoading(false)
  }, [])
  
  const onSubmit = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      
      if (!formData.email || !formData.email.match(emailReg)) {
        setErrInfo({
          type: 'email',
          message: `邮箱内容为空或格式错误`,
        })
        return
      }
      
      if (
        !formData.password ||
        formData.password === '' ||
        formData.password.length < 6
      ) {
        setErrInfo({
          type: 'password',
          message: `请输入合适的密码（6位及以上）`,
        })
        return
      }
      
      setErrInfo({
        type: '',
        message: ``,
      })
      
      if (action.type === 'signin') {
        setActionLoading(true)
        axios({
          method: 'post',
          url: getApiUrl('/paas/api/user/login'),
          data: {
            email: formData.email,
            psd: window.btoa(formData.password),
          },
        })
          .then(({data}) => {
            if (data.code != 1) {
              setErrInfo({
                type: '',
                message: data.msg,
              })
            } else {
              let user = data.data
              setCookie(
                COOKIE_LOGIN_USER,
                JSON.stringify(user),
                30
              )
              Message.success('登录成功')
              setTimeout(() => {
                const {redirectUrl} = getUrlQuery()
                if (typeof redirectUrl === 'string') {
                  location.href = decodeURIComponent(redirectUrl)
                } else {
                  location.href = '/workspace.html'
                }
              }, 500)
            }
          })
          .finally(() => setActionLoading(false))
      }
      
      if (action.type === 'signup') {
        setActionLoading(true)
        axios({
          method: 'post',
          url: getApiUrl('/paas/api/user/register'),
          data: {
            email: formData.email,
            captcha: formData.captcha,
            psd: window.btoa(formData.password),
          },
        })
          .then(({data}) => {
            if (data.code != 1) {
              setErrInfo({
                type: '',
                message: data.msg,
              })
            } else {
              let rData = data.data
              
              setCookie(
                COOKIE_LOGIN_USER,
                JSON.stringify(rData),
                30
              )
              Message.success('注册成功')
              setTimeout(() => {
                location.href = '/workspace.html'
              }, 500)
            }
          })
          .finally(() => setActionLoading(false))
      }
    },
    [formData, action]
  )
  
  const onToggleAction = useCallback(() => {
    setErrInfo({type: '', message: ''})
    setActionLoading(false)
    switch (action.type) {
      case 'signin':
        setAction({
          type: 'signup',
          buttonText: '创建新账户',
          toggleText: '登录',
        })
        break
      case 'signup':
        setAction({
          type: 'signin',
          buttonText: '登录',
          toggleText: '创建新账户',
        })
        break
    }
  }, [action])
  
  const onChangeFormData = useCallback(
    (e, key) => setFormData({...formData, [key]: e.target.value}),
    [formData]
  )
  
  const visibleSubmit = useMemo(() => {
    return (
      !!formData.email &&
      !!formData.password
    )
  }, [formData, action])
  
  if (loading) {
    return null
  }
  
  return (
    <div className={css.page}>
      {/*<div className={css.stickyBar}></div>*/}
      <div className={css.head}>
        <Logo/>
        <p className={css.headTitle}>MyBricks</p>
      </div>
      <div className={css.view}>
        <div className={css.body}>
          <div className={css.content}>
            {(action.type === 'signin' || action.type === 'signup') && (
              <form onSubmit={onSubmit} className={css.form} method="post">
                <div className={css.title}>
                  {action.type === 'signin' ? (
                    <>欢迎使用 My<label>B</label>ricks</>
                  ) : '注册新用户'}
                </div>
                
                <input
                  type="text"
                  className={errInfo.type === 'email' ? css.err : ''}
                  value={formData.email}
                  onChange={(e) => {
                    onChangeFormData(e, 'email')
                  }}
                  placeholder={'邮箱地址'}
                />
                <input
                  type="password"
                  className={errInfo.type === 'password' ? css.err : ''}
                  value={formData.password}
                  onChange={(e) => {
                    onChangeFormData(e, 'password')
                  }}
                  placeholder={'登录密码'}
                />
                <div className={`${css.submit} ${
                  visibleSubmit && !actionLoading && css.visible
                }`}>
                  <button
                    disabled={!visibleSubmit || actionLoading}
                    onClick={onSubmit}
                  >
                    {action.buttonText}
                  </button>
                </div>
                {errInfo.message ? (
                  <div className={css.errMsg}>{errInfo.message}</div>
                ) : null}
                <div className={css.toolbar}>
                  <div
                    className={css.toggleButton}
                  >
                  </div>
                  <div className={css.toggleButton} onClick={onToggleAction}>
                    {/* {action.toggleText} */}
                    {
                      action.type === 'signin' &&
                      <MutiText text={'没有账号？'} subText={'去创建'} onClick={onToggleAction}/>
                    }
                    {
                      action.type === 'signup' &&
                      <MutiText text={'已有账号？'} subText={'去登录'} onClick={onToggleAction}/>
                    }
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
        <div className={css.foot}>
          <div className={css.links}>
            <a
              className={css.github}
              href="https://github.com/mybricks/apaas"
              target="_blank"
            >
              {Github}平台源码
            </a>
            <a
              className={css.vscode}
              href="https://marketplace.visualstudio.com/items?itemName=Mybricks.Mybricks&ssr=false#overview"
              target="_blank"
            >
              {VScode}组件开发
            </a>
            <a
              className={css.docs}
              href="https://docs.mybricks.world/"
              target="_blank"
            >
              文档教程
            </a>
            <a
              className={css.docs}
              href="https://mp.weixin.qq.com/mp/appmsgalbum?__biz=Mzg5OTg1OTYwOA==&action=getalbum&album_id=2591211948751650816"
              target="_blank"
            >
              《企业级低代码》
            </a>
            <a
              className={css.copyright}
              href="https://github.com/mybricks"
              target="_blank"
            >
              @2020 板砖团队
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function MutiText({
                    text = '',
                    subText,
                    subColor = '',
                    onClick,
                  }) {
  return (
    <div className={css.mutiText}>
      {text && <span className={css.text}>{text}</span>}
      <span className={css.subText} style={{color: subColor}} onClick={onClick}>{subText}</span>
    </div>
  )
}