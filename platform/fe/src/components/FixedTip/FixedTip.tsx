import React, { FC } from 'react'
import { Popover } from 'antd'
import { WechatOutlined } from '@ant-design/icons'

import css from './FixedTip.less'

const Qrcode: FC = () => {
  return (
    <div className={css.qrcode}>
      <img src="https://assets.mybricks.world/files/534065092341829/YDbNRhFeeyeMorgGiODjgNFTYMhnivh2-1708313464390.jpeg" alt="" />
      <div>关注获得更多支持</div>
    </div>
  )
}

const FixedTip: FC = () => {
  return (
    <Popover placement="leftTop" content={<Qrcode />}>
      <div className={css.fixedTip}>
        <WechatOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
      </div>
    </Popover>
  )
}

export default FixedTip;
