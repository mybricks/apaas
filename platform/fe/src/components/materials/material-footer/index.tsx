
import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react'
import { Tag } from 'antd'
import classNames from 'classnames'
import css from './index.less'


export default ({ selectedMaterials, onDelete }) => {
  return (
    <div className={classNames(css.footer, { [css.empty]: !!!selectedMaterials.length })}>
      {selectedMaterials.map((m) => {
        return (
          <Tag
            key={m.namespace}
            closable
            style={{ userSelect: 'none' }}
            color='volcano'
            onClose={() => onDelete(m.id)}
          >{m.title ?? m.name}{m.version ? `@${m.version}` : ''}</Tag>
        )
      })}
    </div>
  )
}