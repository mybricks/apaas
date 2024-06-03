// import {createRoot} from 'react-dom/client'

import React from 'react'

import axios from 'axios'
import {createRoot} from '@mybricks/rxui'
import App from './homepage'

axios.defaults.withCredentials = true
const root = createRoot(document.querySelector('#root'))

root.render(<App/>)