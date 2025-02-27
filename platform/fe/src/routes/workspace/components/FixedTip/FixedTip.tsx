import React, { FC } from 'react'
import { Popover } from 'antd'
import { WechatOutlined, CommentOutlined } from '@ant-design/icons'
import { Forum } from './../icon'

import css from './FixedTip.less'

const Qrcode: FC = () => {
  return (
    <div className={css.qrcode}>
      <img src="https://assets.mybricks.world/files/534065092341829/YDbNRhFeeyeMorgGiODjgNFTYMhnivh2-1708313464390.jpeg" alt="" />
      <div>关注获得更多支持</div>
    </div>
  )
}

const BbsEntry: FC = () => {
  return (
    <div className={`${css.icon} ${css.iconBbs}`} onClick={() => window.open('//bbs.mybricks.world')}>
      {Forum}
    </div>
  )
}

const QrcodeEntry: FC = () => {
  return (
    <Popover placement="leftTop" content={<Qrcode />}>
      <div className={`${css.icon} ${css.iconQrcode}`}>
        <WechatOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
      </div>
    </Popover>
  )
}

const FixedTip: FC = () => {
  return (
    <div className={css.fixedTip}>
      <BbsEntry />
      <QrcodeEntry />
    </div>
  )
}

export default FixedTip;
