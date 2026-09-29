import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA：Service Worker 只在安全上下文里注册（https 或 localhost）。
// 手机用局域网 http://<IP>:5173 打开时浏览器不允许注册，这里直接跳过，不报错。
const isSecureContext =
  location.protocol === 'https:' ||
  location.hostname === 'localhost' ||
  location.hostname === '127.0.0.1' ||
  location.hostname === '[::1]'

if ('serviceWorker' in navigator && isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.warn('[pwa] Service Worker 注册失败，离线缓存不可用', err))
  })
}
