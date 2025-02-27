import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Select, message, Input, Button } from 'antd'
import { Code } from '@workspace/components'
import { toJSONFromPageDump } from '@mybricks/file-parser'

import { copyText } from "@workspace/utils/dom";

import css from './index.less'

enum Mode {
  toJSONFromPageDump = 'toJSONFromPageDump',
}

export default () => {
  const [mode, setMode] = useState(Mode.toJSONFromPageDump)
  const [input, setInput] = useState('');
  const [ouput, setOutput] = useState('');

  const handleTransfrom = useCallback(() => {
    try {
      let obj;
      try {
        obj = JSON.parse(input)
      } catch (error) {
        throw new Error('输入值不是合法的 Json 格式')
      }

      if (!obj || !obj?.content) {
        throw new Error('输入值不是合法的 dumpJson 格式')
      }

      const value = toJSONFromPageDump(input)

      setOutput(JSON.stringify(value, null, 2))
    } catch (error) {
      setOutput('')
      console.error(error)
      message.error(error?.message ?? '转换失败')
    }
  }, [input])

  const handleCopy = useCallback(() => {
    copyText(ouput)
    message.success('复制成功')
  }, [ouput])

  return (
    <div className={css.fileParser}>
      <div className={css.header}>
        <Select
          value={mode}
          onChange={setMode}
          options={[
            {
              value: Mode.toJSONFromPageDump,
              label: '单页dumpJson转换成toJson',
            },
          ]}
        />
        <Button type="primary" onClick={handleTransfrom}>转换</Button>
      </div>

      <div className={css.body}>
        <Input.TextArea className={css.input} value={input} onChange={(e) => { setInput(e.target.value) }} />
        <div className={css.toJson}>
          <div className={css.title}>转换结果：<Button type="link" onClick={handleCopy}>复制转换结果</Button></div>
          <div className={css.code}>
            <Code
              height={'260px'}
              readOnly
              value={ouput}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
