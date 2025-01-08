import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Select, message, Input, Button } from 'antd'
import { Code } from '@/components'
import { toJSONFromPageDump } from '@mybricks/file-parser'

import { copyText } from "@/utils/dom";

import css from './index.less'

enum Mode {
  toJSONFromPageDump = 'toJSONFromPageDump',
}

export default () => {
  const [mode, setMode] = useState(Mode.toJSONFromPageDump)
  const [input, setInput] = useState('');
  const [ouput, setOutput] = useState(JSON.stringify({
    "name": "@mybricks/open-cloud-fe",
    "version": "1.0.0",
    "description": "",
    "main": "index.js",
    "scripts": {
      "dev": "webpack-dev-server --config ./scripts/webpack.dev.js",
      "build": "webpack --config ./scripts/webpack.prod.js"
    },
    "repository": {
      "type": "git",
      "url": "git@github.com:mybricks/@mybricks/open-cloud.git"
    },
    "author": "MyBricks Team",
    "license": "ISC",
    "dependencies": {
      "@ant-design/icons": "^5.5.2",
      "@codemirror/lang-json": "^6.0.1",
      "@mybricks/file-parser": "^1.1.0",
      "@mybricks/rxui": "^1.0.86",
      "antd": "^5.18.0",
      "axios": "1.1.3",
      "classnames": "^2.5.1",
      "compare-version": "^0.1.2",
      "formik": "^2.4.6",
      "lodash-es": "^4.17.21",
      "react-router-dom": "^6.23.1"
    },
    "devDependencies": {
      "@babel/core": "^7.18.9",
      "@babel/plugin-proposal-class-properties": "^7.18.6",
      "@babel/preset-env": "^7.18.9",
      "@babel/preset-react": "^7.18.6",
      "@types/lodash-es": "^4.17.6",
      "@types/node": "^18.0.6",
      "@types/react": "^18.0.15",
      "@types/react-dom": "^18.0.15",
      "babel-loader": "^8.2.5",
      "core-js": "^3.23.5",
      "css-loader": "^6.7.1",
      "file-loader": "^6.2.0",
      "fs-extra": "^11.2.0",
      "html-webpack-plugin": "^5.5.0",
      "jszip": "^3.10.1",
      "less": "^4.1.3",
      "less-loader": "^11.0.0",
      "postcss-loader": "^7.0.1",
      "postcss-preset-env": "^9.5.12",
      "raw-loader": "^4.0.1",
      "remove-files-webpack-plugin": "^1.5.0",
      "style-loader": "^3.3.1",
      "ts-loader": "^9.3.1",
      "typescript": "^4.2.3",
      "url-loader": "^4.1.1",
      "webpack": "^5.73.0",
      "webpack-bundle-analyzer": "^4.5.0",
      "webpack-cli": "^4.10.0",
      "webpack-dev-server": "^4.9.3",
      "webpack-merge": "^5.8.0",
      "webpackbar": "^5.0.2"
    }
  }, null, 2
  ));

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
