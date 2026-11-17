import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './themes/theme-cappuccino.css'
import './themes/theme-night-sands.css'
import './themes/theme-amber-obsidian.css'
import './themes/theme-magma-obsidian.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
