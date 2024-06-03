import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  FC,
} from 'react'
import { Github, VScode } from './icons'
import {
  getApiUrl,
  getCookie,
  removeCookie,
  setCookie,
  getUrlQuery,
} from './utils'
import { COOKIE_LOGIN_USER } from './constants'
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import axios from 'axios'

import { Message, Logo } from './components'

import BannerPng from './mybricks.png'

import css from './app.less'

let FINGERPRINT_HASH = ''

const generateFp = async () => {
  const fp = await FingerprintJS.load()
  const res = await fp.get()
  FINGERPRINT_HASH = res.visitorId
}

const checkCurrentIsLogin = async () => {
  await generateFp()
  return new Promise((resolve) => {
    let user: any = getCookie(COOKIE_LOGIN_USER)
    user = JSON.parse(user || '{}')
    if (user && user.id) {
      axios
        .post('/paas/api/user/queryCurrentSession', {
          userId: user.id,
        })
        .then(({ data }) => {
          if (data.code === 1) {
            if (data?.data?.fingerprint === FINGERPRINT_HASH) {
              // 当前账户
              const { redirectUrl } = getUrlQuery()
              if (typeof redirectUrl === 'string') {
                location.href = decodeURIComponent(redirectUrl)
              } else {
                location.href = '/workspace.html'
              }
              resolve(true)
              return
            } else {
              console.warn('当前登录已失效，请重新登陆', 5)
              // 当前账户在其他设备登录
              resolve(false)
            }
          }
        })
    } else {
      resolve(false)
    }
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
      const isLogin = await checkCurrentIsLogin()
      if (isLogin === false) {
        setLoading(false)
      }
    } catch (e) {
      setLoading(false)
    }
  }, [])


  const onSubmit = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()

      const emailReg =
        /^[a-zA-Z\d.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z\d](?:[a-zA-Z\d-]{0,61}[a-zA-Z\d])?(?:\.[a-zA-Z\d](?:[a-zA-Z\d-]{0,61}[a-zA-Z\d])?)*$/
      // const emailReg = /^\w{3,}(\.\w+)*@[A-z0-9]+(\.[A-z]{2,5}){1,2}$/
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
            fingerprint: FINGERPRINT_HASH,
          },
        })
          .then(({ data }) => {
            if (data.code != 1) {
              setErrInfo({
                type: '',
                message: data.msg,
              })
            } else {
              let user = data.data
              setCookie(
                COOKIE_LOGIN_USER,
                JSON.stringify({
                  id: user.id,
                  email: user.email,
                  fingerprint: FINGERPRINT_HASH,
                }),
                30
              )
              Message.success('登录成功')
              setTimeout(() => {
                const { redirectUrl } = getUrlQuery()
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
            fingerprint: FINGERPRINT_HASH,
          },
        })
          .then(({ data }) => {
            if (data.code != 1) {
              setErrInfo({
                type: '',
                message: data.msg,
              })
            } else {
              let rData = data.data

              setCookie(
                COOKIE_LOGIN_USER,
                JSON.stringify({
                  id: rData.userId,
                  email: formData.email,
                  fingerprint: FINGERPRINT_HASH,
                }),
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
    setErrInfo({ type: '', message: '' })
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
    (e, key) => setFormData({ ...formData, [key]: e.target.value }),
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
      <div className={css.head}>
        <Logo />
      </div>
      <div className={css.body}>
        <div className={css.entry}>
          <div className={css.aside}>
            <img className={css.banner} src={BannerPng} alt="" />
            <div className={css.title}>欢迎来到 MyBricks</div>
          </div>

          <div className={css.content}>
            {(action.type === 'signin' || action.type === 'signup') && (
              <form onSubmit={onSubmit} className={css.form} method="post">
                <div className={css.title}>
                  {action.type === 'signin' ? '账号登录' : '注册新用户'}
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

                <button
                  className={`${css.submit} ${
                    visibleSubmit && !actionLoading && css.visible
                  }`}
                  disabled={!visibleSubmit || actionLoading}
                  onClick={onSubmit}
                >
                  {action.buttonText}
                </button>
                {errInfo.message ? (
                  <div className={css.errMsg}>{errInfo.message}</div>
                ) : null}
                <div className={css.toolbar}>
                  <div
                    className={css.toggleButton}
                    onClick={() => alert('暂不支持此功能')}
                  >
                    找回密码
                  </div>
                  <div className={css.toggleButton} onClick={onToggleAction}>
                    {action.toggleText}
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* foot */}
      <div className={css.foot}>
        <div className={css.links}>
          <a
            className={css.github}
            href="https://github.com/mybricks/designer-spa-demo"
            target="_blank"
          >
            {Github}Demo源码
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
            href="https://mp.weixin.qq.com/mp/appmsgalbum?__biz=Mzg5OTg1OTYwOA==&action=getalbum&album_id=2664963833182224385"
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
  )
}