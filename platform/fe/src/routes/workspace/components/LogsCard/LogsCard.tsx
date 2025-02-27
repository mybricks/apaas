import * as React from 'react'
// import CodeMirror from '@uiw/react-codemirror'
// import {
//   hyperLink,
//   hyperLinkExtension,
// } from '@uiw/codemirror-extensions-hyper-link'
// import { json } from '@codemirror/lang-json'


// export default ({ height = '500px', value }) => {
//   return (
//     <CodeMirror
//       height={height}
//       basicSetup={{ crosshairCursor: true }}
//       readOnly
//       value={value}
//       // theme={solarizedLight}
//       autoFocus
//       extensions={[
//         json(),
//       ]}
//       // extensions={extensions}
//       // onCreateEditor={scrollToBottom}
//       // onUpdate={handleUpdate}
//     />
//   )
// }

import { Code } from '@workspace/components'

export default ({ height = '500px', value }) => {
  return (
    <Code
      height={height}
      readOnly
      value={value}
    />
  )
}