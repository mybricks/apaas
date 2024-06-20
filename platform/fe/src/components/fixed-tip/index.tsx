import React from 'react'
import { Popover } from 'antd'
import { WechatOutlined } from '@ant-design/icons'

import css from './index.less'

const Qrcode = () => {
  return (
    <div className={css.qrcode}>
      <div>不会使用？微信「扫一扫」添加交流群</div>
      <img src="https://assets.mybricks.world/wxq-qrcode.png" alt="" />
    </div>
  )
}

export function FixedTip() {
  return (
    <Popover placement="leftTop" content={<Qrcode />}>
      <div className={css.fixedTip}>
        <WechatOutlined />
        <div className={css.text}>
          加入
          <br />
          交流群
        </div>
      </div>
    </Popover>
  )
}
