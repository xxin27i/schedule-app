import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../lib/store'
import { dayNumber, monthLabel, relativeLabel, todayKey, weekdayLabel } from '../lib/date'
import { ChevronLeftIcon, ChevronRightIcon, TaskCircle } from './ui'

const SNAP_MS = 300 // 松手后归位 / 翻过去的时长
const BOOK_RATIO = 1.42 // 书宽 / 书高
const PER_PAGE = 6 // 每页最多条目
const FUTURE_DAYS = 14 // 计划书里最多展开的未来天数
const COMMIT = 0.32 // 手指拖过这个比例就翻过去
const FLICK = 0.35 // 快速甩动的速度阈值（px/ms）
const DRAG_START = 8 // 超过这个位移才算拖动，否则视为点击

/* 厚卡片的物理：纸有厚度，所以翻过去的纸压不平，
   每往上一层就多翘一点，下面那张就露出一点边 —— 一沓卡片的扇形。 */
const FAN_UP = 1.6 // 右侧还没翻的纸，每往下一层多张开的角度（度）
const FAN_DOWN = 3 // 左侧已经翻过去的纸，每往上一层多翘起（度）
const FAN_CAP = 4 // 扇形最多累计几层，避免翻多了角度离谱
const DEPTH_STEP = 2.5 // 每深一层往下错开的像素：露出下面的纸边
const UNDER = 6 // 书体底下的纸叠层数
const CARD_R = 12 // 卡片圆角

/* --------------------------- 计划内容 -> 分页 --------------------------- */

function chunk(list, size) {
  const out = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

function pushItemPages(pages, base, items) {
  const groups = chunk(items, PER_PAGE)
  if (groups.length === 0) groups.push([])
  groups.forEach((group, i) => {
    pages.push({
      ...base,
      items: group,
      total: items.length,
      done: items.filter((t) => t.done).length,
      part: groups.length > 1 ? { i: i + 1, n: groups.length } : null,
    })
  })
}

function buildPages(tasks, activeList) {
  const mine = tasks.filter((t) => !activeList || t.listId === activeList.id)
  const today = todayKey()

  const byDate = new Map()
  for (const t of mine) {
    if (!t.date) continue
    if (!byDate.has(t.date)) byDate.set(t.date, [])
    byDate.get(t.date).push(t)
  }
  const pool = mine.filter((t) => !t.date)

  const pages = []

  pushItemPages(pages, { kind: 'day', dayKey: today, isToday: true }, byDate.get(today) ?? [])

  const upcoming = [...byDate.keys()].filter((d) => d > today).sort().slice(0, FUTURE_DAYS)
  for (const d of upcoming) {
    pushItemPages(pages, { kind: 'day', dayKey: d, isToday: false }, byDate.get(d) ?? [])
  }

  pushItemPages(pages, { kind: 'pool' }, pool)
  pages.push({ kind: 'overview' })

  if (pages.length % 2 === 1) pages.push({ kind: 'end' })
  return pages
}

/* ------------------------------- 纸页内容 ------------------------------- */

function Rule() {
  return <div className="mt-2 h-px w-full bg-paper-ink/12" />
}

function DateChip({ dayKey, isToday }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-[54px] w-[48px] shrink-0 place-items-center rounded-[11px] bg-paper-line/55 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_1px_2px_rgba(120,100,60,0.18)]">
        <span className="text-[20px] font-bold leading-none tracking-tight text-paper-ink">
          {dayNumber(dayKey)}
        </span>
        <span className="mt-0.5 text-[9.5px] font-medium leading-none text-paper-ink/70">
          {weekdayLabel(dayKey)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-paper-soft">
          {isToday ? 'Today' : 'Plan'}
        </p>
        <p className="mt-1 truncate text-[13px] font-semibold tracking-tight text-paper-ink">
          {monthLabel(dayKey)} · {isToday ? '今天' : relativeLabel(dayKey)}
        </p>
      </div>
    </div>
  )
}

function PaperItem({ task, onToggle }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-px">
        <TaskCircle
          done={task.done}
          tone="paper"
          size="sm"
          label={`${task.done ? '标记为未完成' : '标记为完成'} ${task.title}`}
          onToggle={() => onToggle(task)}
        />
      </span>
      <span
        className={`min-w-0 flex-1 text-[11.5px] leading-snug ${
          task.done
            ? 'text-paper-soft line-through decoration-paper-soft/60'
            : 'font-medium text-paper-ink'
        }`}
      >
        {task.title}
      </span>
    </div>
  )
}

function PaperFooter({ children }) {
  return (
    <div className="shrink-0 pt-2 text-[9px] uppercase tracking-[0.16em] text-paper-soft">
      {children}
    </div>
  )
}

function PageBody({ page, onToggle }) {
  if (!page) return null

  if (page.kind === 'day') {
    return (
      <div className="flex h-full flex-col px-4 pb-3 pt-4">
        <div className="shrink-0">
          <DateChip dayKey={page.dayKey} isToday={page.isToday} />
        </div>
        <div className="page-lines mt-3.5 min-h-0 flex-1 space-y-[9px] overflow-hidden pt-1">
          {page.items.length > 0 ? (
            page.items.map((t) => <PaperItem key={t.id} task={t} onToggle={onToggle} />)
          ) : (
            <p className="text-[11px] leading-relaxed text-paper-soft">
              这一天还没有安排。
              <br />
              去日程页把任务拖到这一天吧。
            </p>
          )}
        </div>
        <PaperFooter>
          共 {page.total} 项 · 完成 {page.done}
          {page.part ? ` · ${page.part.i}/${page.part.n}` : ''}
        </PaperFooter>
      </div>
    )
  }

  if (page.kind === 'pool') {
    return (
      <div className="flex h-full flex-col px-4 pb-3 pt-4">
        <div className="shrink-0">
          <h3 className="text-[15px] font-bold tracking-tight text-paper-ink">待执行</h3>
          <p className="mt-1 text-[10px] text-paper-soft">尚未安排日期的计划</p>
          <Rule />
        </div>
        <div className="page-lines mt-3 min-h-0 flex-1 space-y-[9px] overflow-hidden pt-1">
          {page.items.length > 0 ? (
            page.items.map((t) => <PaperItem key={t.id} task={t} onToggle={onToggle} />)
          ) : (
            <p className="text-[11px] text-paper-soft">池子空了，所有计划都排好日期了</p>
          )}
        </div>
        <PaperFooter>
          共 {page.total} 项 · 完成 {page.done}
          {page.part ? ` · ${page.part.i}/${page.part.n}` : ''}
        </PaperFooter>
      </div>
    )
  }

  if (page.kind === 'overview') {
    return (
      <div className="flex h-full flex-col px-4 pb-3 pt-4">
        <div className="shrink-0">
          <h3 className="text-[15px] font-bold tracking-tight text-paper-ink">清单总览</h3>
          <Rule />
        </div>
        <div className="mt-3 min-h-0 flex-1 space-y-3.5 overflow-hidden">
          {(page.lists ?? []).map((l) => {
            const pct = l.total > 0 ? Math.round((l.done / l.total) * 100) : 0
            return (
              <div key={l.id}>
                <div className="flex items-center gap-2 text-[11.5px]">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: l.color }}
                  />
                  <span className="min-w-0 flex-1 truncate font-semibold text-paper-ink">
                    {l.name}
                  </span>
                  <span className="tabular-nums text-paper-soft">
                    {l.done}/{l.total}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-ink/12">
                  <div
                    className="h-full rounded-full bg-paper-check"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        <PaperFooter>共 {(page.lists ?? []).length} 个清单</PaperFooter>
      </div>
    )
  }

  if (page.kind === 'end') {
    return (
      <div className="grid h-full place-items-center px-4 py-4">
        <div className="text-center">
          <div className="mx-auto h-[3px] w-10 rounded-full bg-paper-line" />
          <p className="mt-4 text-[12px] font-semibold tracking-[0.3em] text-paper-soft">完</p>
          <p className="mt-2 text-[10px] text-paper-soft">继续把计划写下去</p>
        </div>
      </div>
    )
  }

  return null
}

function BookCover({ activeList, total, done }) {
  return (
    <div className="flex h-full flex-col justify-between px-5 py-6">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.34em] text-paper-soft">
          MY PLAN
        </p>
        <h2 className="mt-3 text-[23px] font-bold leading-tight tracking-tight text-paper-ink">
          {activeList?.name ?? '我的计划'}
        </h2>
        <div className="mt-4 h-[3px] w-12 rounded-full bg-paper-line" />
        <p className="mt-5 text-[11px] leading-relaxed text-paper-soft">
          共 {total} 项计划
          <br />
          已完成 {done} 项
        </p>
      </div>
      <div className="text-[10px] leading-relaxed text-paper-soft">
        {monthLabel(todayKey())}
        <br />
        计划手帐
      </div>
    </div>
  )
}

/* -------------------------------- 计划书 -------------------------------- */

/** 纸已经翻过去之后停在哪个角度：永远压不平，越上面翘得越多 */
function flippedAngle(k) {
  return -180 + FAN_DOWN * Math.min(k, FAN_CAP)
}

/** 某张纸静止时的角度：没翻的平摊在右侧，翻过去的翘在左侧 */
function restAngle(k, turn) {
  return k < turn ? flippedAngle(k) : FAN_UP * Math.min(k - turn, FAN_CAP)
}

/** 拖动中的角度：由手指决定（p = 0..1） */
function angleOf(k, turn, flip) {
  if (flip && flip.k === k) {
    return flippedAngle(k) * (flip.dir === 'fwd' ? flip.p : 1 - flip.p)
  }
  return restAngle(k, turn)
}

export default function PlanBook() {
  const { lists, tasks, activeList, dispatch } = useStore()
  const [turn, setTurn] = useState(0)
  const [flip, setFlip] = useState(null) // { k, dir, p, live }
  const [size, setSize] = useState({ w: 0, h: 0 })

  const fitRef = useRef(null)
  const rafRef = useRef(0)
  const dragRef = useRef(null)
  const endRef = useRef(0)
  const busyRef = useRef(false)

  const pages = useMemo(() => {
    const built = buildPages(tasks, activeList)
    const overview = built.find((p) => p.kind === 'overview')
    if (overview) {
      overview.lists = lists.map((l) => {
        const items = tasks.filter((t) => t.listId === l.id)
        return {
          id: l.id,
          name: l.name,
          color: l.color,
          total: items.length,
          done: items.filter((t) => t.done).length,
        }
      })
    }
    return built
  }, [tasks, lists, activeList])

  const sheets = useMemo(() => chunk(pages, 2), [pages])
  const maxTurn = sheets.length

  // 卡片厚度：跟着书的尺寸走（手机上约 6px，桌面上约 12px）
  const card = Math.max(5, Math.min(12, Math.round(size.w * 0.017)))

  useEffect(() => {
    busyRef.current = !!flip
  }, [flip])

  useEffect(() => {
    clearTimeout(endRef.current)
    setFlip(null)
    setTurn((t) => Math.min(t, maxTurn))
  }, [maxTurn])

  useEffect(
    () => () => {
      clearTimeout(endRef.current)
      cancelAnimationFrame(rafRef.current)
    },
    [],
  )

  // 书页尺寸：按可用空间等比缩放。
  // 必须观察「不受书本尺寸影响」的容器（fitRef，无 padding、overflow hidden），
  // 且只在数值真正变化时更新 state；否则书本溢出会撑出滚动条 → 重新测量 → 尺寸往复抖动。
  useEffect(() => {
    const el = fitRef.current
    if (!el) return undefined
    const measure = () => {
      const availW = Math.max(0, el.clientWidth)
      const availH = Math.max(0, el.clientHeight)
      if (availW < 40 || availH < 40) return
      let w = availW
      let h = w / BOOK_RATIO
      if (h > availH) {
        h = availH
        w = h * BOOK_RATIO
      }
      const next = { w: Math.floor(w), h: Math.floor(h) }
      setSize((prev) => (prev.w === next.w && prev.h === next.h ? prev : next))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /** 松手：要么翻过去，要么弹回原位 */
  const settle = useCallback((k, dir, commit) => {
    setFlip({ k, dir, p: commit ? 1 : 0, live: false })
    clearTimeout(endRef.current)
    endRef.current = setTimeout(() => {
      setFlip(null)
      if (commit) setTurn((t) => (dir === 'fwd' ? t + 1 : t - 1))
    }, SNAP_MS + 60)
  }, [])

  const go = useCallback(
    (dir) => {
      if (busyRef.current) return
      if (dir === 'fwd' && turn >= maxTurn) return
      if (dir === 'bwd' && turn <= 0) return
      settle(dir === 'fwd' ? turn : turn - 1, dir, true)
    },
    [turn, maxTurn, settle],
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go('fwd')
      else if (e.key === 'ArrowLeft') go('bwd')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  const onPointerDown = (e) => {
    if (e.target.closest('button')) return
    if (busyRef.current) return
    dragRef.current = {
      x0: e.clientX,
      y0: e.clientY,
      t0: performance.now(),
      x: e.clientX,
      t: performance.now(),
      v: 0,
      k: null,
      dir: null,
      p: 0,
    }
  }

  const onPointerMove = (e) => {
    const d = dragRef.current
    if (!d) return
    const now = performance.now()
    const dx = e.clientX - d.x0
    const dy = e.clientY - d.y0
    d.v = (e.clientX - d.x) / Math.max(1, now - d.t)
    d.x = e.clientX
    d.t = now

    if (d.dir === null) {
      // 还不够「横」就先不接管，避免和页面滚动抢手势
      if (Math.abs(dx) < DRAG_START || Math.abs(dx) <= Math.abs(dy)) return
      const dir = dx < 0 ? 'fwd' : 'bwd'
      if (dir === 'fwd' && turn >= maxTurn) return
      if (dir === 'bwd' && turn <= 0) return
      d.dir = dir
      d.k = dir === 'fwd' ? turn : turn - 1
      setFlip({ k: d.k, dir, p: 0, live: true })
    }

    const w = size.w || 320
    d.p = Math.min(1, Math.max(0, (d.dir === 'fwd' ? -dx : dx) / w))
    // rAF 合并，避免每个 move 都触发一次 React 渲染
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      setFlip((f) => (f ? { ...f, p: d.p } : f))
    })
  }

  const onPointerUp = (e) => {
    const d = dragRef.current
    dragRef.current = null
    cancelAnimationFrame(rafRef.current)
    if (!d) return

    if (d.dir === null) {
      // 没拖动 → 当作点击，点左右半边翻页
      const rect = fitRef.current?.getBoundingClientRect()
      const still = Math.abs(e.clientX - d.x0) < 10 && Math.abs(e.clientY - d.y0) < 10
      if (rect && still && performance.now() - d.t0 < 600) {
        go(e.clientX - rect.left > rect.width / 2 ? 'fwd' : 'bwd')
      }
      return
    }

    const fast = d.dir === 'fwd' ? d.v < -FLICK : d.v > FLICK
    settle(d.k, d.dir, d.p >= COMMIT || fast)
  }

  const cancelDrag = () => {
    const d = dragRef.current
    dragRef.current = null
    cancelAnimationFrame(rafRef.current)
    if (d && d.dir !== null) settle(d.k, d.dir, false)
  }

  const toggleTask = (task) => dispatch({ type: 'toggleTask', id: task.id })

  const mine = activeList ? tasks.filter((t) => t.listId === activeList.id) : tasks
  const mineTotal = mine.length
  const mineDone = mine.filter((t) => t.done).length

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="safe-top shrink-0 px-4 pb-1 pt-4">
        <div className="flex items-baseline gap-2">
          <h1 className="text-[22px] font-semibold tracking-tight text-mist-50">计划书</h1>
          <span className="text-[11px] text-mist-500">
            {activeList?.name ?? '我的清单'} · 第 {Math.min(turn + 1, maxTurn)} / {maxTurn} 跨页
          </span>
        </div>
      </header>

      <div
        className="book-stage min-h-0 flex-1 select-none overflow-hidden px-3 py-4"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={cancelDrag}
      >
        <div ref={fitRef} className="grid h-full w-full place-items-center overflow-hidden">
          <div className="book relative" style={{ width: size.w, height: size.h }}>
            {/* 纸张厚度：书体底下错出的一沓纸，只在下方和两侧露出纸口 */}
            {Array.from({ length: UNDER }).map((_, i) => (
              <div
                key={`u${i}`}
                className="book-under"
                style={{
                  zIndex: 0,
                  top: (i + 1) * 1.4,
                  left: -(i + 1) * 0.8,
                  right: -(i + 1) * 0.8,
                  bottom: -(i + 1) * 2.6,
                  opacity: 1 - i * 0.08,
                }}
              />
            ))}

            {/* 整本书的底纸 */}
            <div className="book-paper absolute inset-0 rounded-[12px]" style={{ zIndex: 1 }} />

            {/* 第 0 跨页的左页：封面（一样是一张厚卡片） */}
            {turn === 0 ? (
              <div
                className="absolute left-0 top-0 h-full w-1/2"
                style={{ zIndex: 2, transformStyle: 'preserve-3d' }}
              >
                <div
                  className="book-face book-paper book-card absolute inset-0 overflow-hidden rounded-l-[12px]"
                  style={{ transform: `translateZ(${card / 2}px)` }}
                >
                  <BookCover activeList={activeList} total={mineTotal} done={mineDone} />
                  <div className="book-spine-left pointer-events-none absolute inset-y-0 right-0 w-8" />
                </div>
                <div
                  className="book-slab"
                  style={{
                    right: '100%',
                    top: CARD_R,
                    bottom: CARD_R,
                    width: card,
                    transformOrigin: 'right center',
                    transform: `translateZ(${card / 2}px) rotateY(-90deg)`,
                  }}
                />
                <div
                  className="book-slab book-slab--h"
                  style={{
                    top: 0,
                    left: CARD_R,
                    right: CARD_R,
                    height: card,
                    transformOrigin: 'center top',
                    transform: `translateZ(${card / 2}px) rotateX(-90deg)`,
                  }}
                />
                <div
                  className="book-slab book-slab--h"
                  style={{
                    top: '100%',
                    left: CARD_R,
                    right: CARD_R,
                    height: card,
                    transformOrigin: 'center top',
                    transform: `translateZ(${-card / 2}px) rotateX(90deg)`,
                  }}
                />
              </div>
            ) : null}

            {/* 书页：一张厚卡片，两张纸面 + 四周的切口 */}
            {sheets.map((sheet, k) => {
              const isFlipping = !!flip && flip.k === k
              const turned = k < turn
              const rot = angleOf(k, turn, flip)
              // 静止时按「第几层」往下错开：下面的纸会从边上露出来一点点
              const depth = turned ? turn - 1 - k : k - turn
              const dy = Math.min(depth, FAN_CAP) * DEPTH_STEP
              const lifting = isFlipping && flip.live
              // 翻起过程中抬离书体，投影随之加重
              const lift = lifting ? Math.sin(Math.PI * flip.p) : 0
              const z = isFlipping ? maxTurn + 4 : turned ? k + 1 : maxTurn - k + 1
              const shadow = lifting
                ? `0 ${5 + lift * 26}px ${12 + lift * 38}px -8px rgba(44, 34, 18, ${
                    0.16 + lift * 0.42
                  })`
                : '0 3px 8px -4px rgba(44, 34, 18, 0.34)'
              return (
                <div
                  key={k}
                  className={`book-sheet ${lifting ? 'book-sheet--live' : ''}`}
                  style={{
                    zIndex: z,
                    transform: `translateY(${dy}px) translateZ(${
                      lift * 26
                    }px) rotateY(${rot}deg)`,
                    transition: lifting ? 'none' : `transform ${SNAP_MS}ms cubic-bezier(.22,.72,.24,1)`,
                    boxShadow: shadow,
                  }}
                >
                  {/* 正面（右页） */}
                  <div
                    className="book-face book-paper book-card rounded-r-[12px]"
                    style={{ transform: `translateZ(${card / 2}px)` }}
                  >
                    <PageBody page={sheet[0]} onToggle={toggleTask} />
                    <div className="book-spine-right pointer-events-none absolute inset-y-0 left-0 w-8" />
                    <span className="absolute bottom-1.5 right-2.5 text-[9px] tabular-nums text-paper-soft/80">
                      {2 * k + 1}
                    </span>
                  </div>
                  {/* 背面（左页） */}
                  <div
                    className="book-face book-card book-face--back book-paper rounded-l-[12px]"
                    style={{ transform: `rotateY(180deg) translateZ(${card / 2}px)` }}
                  >
                    <PageBody page={sheet[1]} onToggle={toggleTask} />
                    <div className="book-spine-left pointer-events-none absolute inset-y-0 right-0 w-8" />
                    <span className="absolute bottom-1.5 left-2.5 text-[9px] tabular-nums text-paper-soft/80">
                      {2 * k + 2}
                    </span>
                  </div>
                  {/* 纸的切口：外沿一张，上下各一张，围出这张卡片的厚度 */}
                  <div
                    className="book-slab"
                    style={{
                      left: '100%',
                      top: CARD_R,
                      bottom: CARD_R,
                      width: card,
                      transformOrigin: 'left center',
                      transform: `translateZ(${card / 2}px) rotateY(90deg)`,
                    }}
                  />
                  <div
                    className="book-slab book-slab--h"
                    style={{
                      top: 0,
                      left: CARD_R,
                      right: CARD_R,
                      height: card,
                      transformOrigin: 'center top',
                      transform: `translateZ(${card / 2}px) rotateX(-90deg)`,
                    }}
                  />
                  <div
                    className="book-slab book-slab--h"
                    style={{
                      top: '100%',
                      left: CARD_R,
                      right: CARD_R,
                      height: card,
                      transformOrigin: 'center top',
                      transform: `translateZ(${-card / 2}px) rotateX(90deg)`,
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="shrink-0 px-4 pb-2">
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            className="book-btn"
            aria-label="上一页"
            disabled={turn <= 0}
            onClick={() => go('bwd')}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <span className="min-w-[52px] text-center text-[12px] font-medium tabular-nums text-mist-300">
            {Math.min(turn + 1, maxTurn)} / {maxTurn}
          </span>
          <button
            type="button"
            className="book-btn"
            aria-label="下一页"
            disabled={turn >= maxTurn}
            onClick={() => go('fwd')}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10.5px] text-mist-500">
          手指按住纸页左右拖即可翻页 · 点圆圈可直接勾选
        </p>
      </div>
    </div>
  )
}
