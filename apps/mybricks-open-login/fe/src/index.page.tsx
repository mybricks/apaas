import { createRoot } from 'react-dom/client';
import axios from "axios"
import React from 'react'

axios.defaults.withCredentials = true

import App from './app'

createRoot(document.querySelector('#root')).render(<App />);