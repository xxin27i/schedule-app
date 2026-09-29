/* 计划手帐 Service Worker
 *
 * 只在安全上下文（https / localhost）里才会被注册，见 src/main.jsx。
 * 手机通过局域网 http://<IP>:5173 打开时浏览器不允许注册，本文件也不会生效。
 *
 * 策略：
 *  - 页面导航：网络优先，断网时回退到缓存里的 index.html
 *  - 静态资源：缓存优先 + 后台更新
 *  - 开发期模块（/src/、/@vite/、/@react-refresh、/node_modules/）直接走网络，保证 HMR 正常
 */
const VERSION = 'v2'
const SHELL_CACHE = `planbook-shell-${VERSION}`
const RUNTIME_CACHE = `planbook-runtime-${VERSION}`
const KEEP = [SHELL_CACHE, RUNTIME_CACHE]

const SHELL_ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon.svg']

const isDevRequest = (url) =>
  url.pathname.startsWith('/src/') ||
  url.pathname.startsWith('/@') ||
  url.pathname.startsWith('/node_modules/')

/** 复制一份响应、并去掉 Vary（原因见 cacheFresh 的注释） */
function withoutVary(res, body) {
  const headers = new Headers(res.headers)
  headers.delete('vary')
  return new Response(body ?? res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  })
}

/* 取一份资源并写进缓存。
 * 必须去掉 Vary：不少静态服务器（vite preview、带 CORS 中间件的都算）会给
 * 资源加 `Vary: Origin`，而 cache.match 会拿 Vary 里的请求头逐字比对——
 * SW 自己 fetch 出来的那份和页面发出的那份请求头不一定一致
 * （页面用 crossorigin 加载模块脚本时会带 Origin，预缓存请求不带），
 * 结果就是「缓存里明明有、却匹配不上」，断网直接 ERR_FAILED。 */
async function cacheFresh(cache, url) {
  try {
    const res = await fetch(url, { cache: 'no-cache' })
    if (!res || !res.ok) return
    await cache.put(url, withoutVary(res))
  } catch {
    // 单个资源失败不影响其余预缓存
  }
}

/* index.html 里引用的构建产物（/assets/index-xxx.js、/assets/index-xxx.css…）
 * 必须一起预缓存：首次访问时它们是「SW 接管之前」加载的，
 * 不会经过 fetch 事件，只靠运行时缓存会导致装好后第一次断网打不开。 */
async function precacheShell() {
  const cache = await caches.open(SHELL_CACHE)
  await Promise.all(SHELL_ASSETS.map((url) => cacheFresh(cache, url)))

  try {
    const res = await fetch('/index.html', { cache: 'no-cache' })
    if (!res.ok) return
    const html = await res.text()
    const refs = new Set()
    const re = /(?:src|href)="(\/[^"#?]+)"/g
    let m
    while ((m = re.exec(html))) {
      const path = m[1]
      if (isDevRequest({ pathname: path })) continue // 开发期模块不缓存
      if (!/\.(?:js|css|png|svg|jpe?g|webp|woff2?|json|webmanifest)$/.test(path)) continue
      refs.add(path)
    }
    await Promise.all([...refs].map((url) => cacheFresh(cache, url)))
  } catch {
    // 预缓存构建产物失败不影响基本可用性
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    precacheShell()
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  let url
  try {
    url = new URL(req.url)
  } catch {
    return
  }
  if (url.origin !== self.location.origin) return
  if (isDevRequest(url)) return

  // 页面导航：网络优先，失败回退缓存外壳
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches
            .open(SHELL_CACHE)
            .then((c) => c.put('/index.html', withoutVary(res.clone())))
            .catch(() => {})
          return res
        })
        .catch(() => caches.match('/index.html').then((hit) => hit || Response.error())),
    )
    return
  }

  // 静态资源：缓存优先 + 后台更新；断网时回退到缓存
  event.respondWith(
    caches.match(req).then((hit) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === 'basic') {
            const copy = withoutVary(res.clone())
            caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy)).catch(() => {})
          }
          return res
        })
        .catch(() => hit || Response.error())
      return hit || network
    }),
  )
})
