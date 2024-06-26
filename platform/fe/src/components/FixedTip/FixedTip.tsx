import React, { FC } from 'react'
import { Popover } from 'antd'
import { WechatOutlined } from '@ant-design/icons'

import css from './FixedTip.less'

const Qrcode: FC = () => {
  return (
    <div className={css.qrcode}>
      <div>不会使用？微信「扫一扫」添加交流群</div>
      <img src="https://assets.mybricks.world/wxq-qrcode.png" alt="" />
    </div>
  )
}

const FixedTip: FC = () => {
  return (
    <Popover placement="leftTop" content={<Qrcode />}>
      <div className={css.fixedTip}>
        <WechatOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
        <div className={css.text}>
          加入
          <br />
          交流群
        </div>
      </div>
    </Popover>
  )
}

export default FixedTip;
