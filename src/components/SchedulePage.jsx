import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCorners,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useStore } from '../lib/store'
import {
  dayNumber,
  keyRange,
  monthLabel,
  relativeLabel,
  shiftKey,
  todayKey,
  weekdayLabel,
} from '../lib/date'
import { suppressClickAfterDrag } from '../lib/dragGuard'
import TaskRow from './TaskRow'
import { InlineAddTask, ListSelect } from './ui'

function daysBetween(aKey, bKey) {
  const [ay, am, ad] = aKey.split('-').map(Number)
  const [by, bm, bd] = bKey.split('-').map(Number)
  return Math.round((new Date(by, bm - 1, bd) - new Date(ay, am - 1, ad)) / 86400000)
}

const collisionDetection = (args) => {
  const within = pointerWithin(args)
  return within.length > 0 ? within : closestCorners(args)
}

/* --------------------------------- 日期卡片 -------------------------------- */

function DayCard({
  dayKey,
  tasks,
  isToday,
  onOpenDay,
  onToggle,
  onOpenActions,
  onAddTask,
  registerRef,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${dayKey}` })
  const done = tasks.filter((t) => t.done).length
  const allDone = tasks.length > 0 && done === tasks.length

  return (
    <div
      ref={(node) => {
        setNodeRef(node)
        registerRef(dayKey, node)
      }}
      data-day={dayKey}
      className={`overflow-hidden rounded-xl border bg-ink-850 transition-colors duration-200 ${
        isOver ? 'border-brand-500 bg-brand-500/10' : 'border-ink-800'
      }`}
    >
      <button
        type="button"
        onClick={() => onOpenDay(dayKey)}
        className="flex w-full items-center gap-2 px-3 pb-1 pt-2.5 text-left active:bg-ink-800/60"
      >
        <span
          className={`text-[19px] font-bold leading-none tracking-tight ${
            isToday ? 'text-brand-500' : 'text-mist-50'
          }`}
        >
          {dayNumber(dayKey)}
        </span>
        <span className="text-[11px] leading-none text-mist-400">{weekdayLabel(dayKey)}</span>
        {isToday ? (
          <span className="rounded bg-brand-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand-400">
            今天
          </span>
        ) : (
          <span className="text-[10px] text-mist-500">{relativeLabel(dayKey)}</span>
        )}

        {tasks.length > 0 ? (
          <span
            className={`ml-auto text-[10.5px] font-semibold tabular-nums ${
              allDone ? 'text-mint-400' : 'text-mist-500'
            }`}
          >
            {done}/{tasks.length}
          </span>
        ) : null}
      </button>

      <div className="px-1 pb-1.5">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            compact
            divided
            onToggle={onToggle}
            onOpenActions={onOpenActions}
          />
        ))}

        {/* 点一下就地录入，不再弹窗 */}
        <InlineAddTask
          compact
          placeholder={isToday ? '添加今天的任务' : '添加任务'}
          onSubmit={(title) => onAddTask(title, dayKey)}
        />
      </div>
    </div>
  )
}

/* --------------------------------- 待执行池 -------------------------------- */
/* 必须作为 <DndContext> 的子组件渲染，useDroppable 才能注册到当前拖拽上下文 */

function PoolColumn({ tasks, lists, activeListId, onSwitchList, onToggle, onOpenActions, onAddTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'pool' })

  return (
    <aside className="flex min-h-0 w-[44%] max-w-[210px] shrink-0 flex-col border-l border-ink-800">
      {/* 清单下拉框：直接切换首页展示的清单 */}
      <div className="shrink-0 px-2 pt-2">
        <ListSelect
          prominent
          lists={lists}
          value={activeListId}
          onChange={onSwitchList}
          className="w-full"
        />
      </div>

      <div className="flex shrink-0 items-center gap-1.5 px-2.5 pt-2.5">
        <h2 className="text-[13px] font-semibold tracking-tight text-mist-50">待执行</h2>
        <span className="text-[10.5px] font-semibold tabular-nums text-mist-500">
          {tasks.length}
        </span>
        <span className="ml-auto text-[9.5px] text-mist-500">拖到左侧某天</span>
      </div>

      <div
        ref={setNodeRef}
        className={`no-scrollbar min-h-0 flex-1 overflow-y-auto px-1 pb-24 pt-1 transition-colors duration-200 ${
          isOver ? 'bg-brand-500/10' : ''
        }`}
      >
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            divided
            onToggle={onToggle}
            onOpenActions={onOpenActions}
          />
        ))}
        {tasks.length === 0 ? (
          <p className="px-2 py-3 text-[10.5px] leading-relaxed text-mist-500">
            池子空了，把下面的计划一条条写进来吧。
          </p>
        ) : null}
        <InlineAddTask placeholder="添加任务" onSubmit={(title) => onAddTask(title, null)} />
      </div>
    </aside>
  )
}

/* ---------------------------------- 主页面 --------------------------------- */

export default function SchedulePage({ onOpenDayDetail, onOpenTaskActions }) {
  const { lists, activeList, tasks, dispatch } = useStore()
  const [rangeStart, setRangeStart] = useState(() => shiftKey(todayKey(), -7))
  const [rangeEnd, setRangeEnd] = useState(() => shiftKey(todayKey(), 20))
  const [draggingId, setDraggingId] = useState(null)

  const dayNodes = useRef(new Map())
  const today = todayKey()

  const days = useMemo(
    () => keyRange(rangeStart, daysBetween(rangeStart, rangeEnd) + 1),
    [rangeStart, rangeEnd],
  )

  const { dayTasksMap, poolTasks, taskById } = useMemo(() => {
    const dayTasks = new Map()
    const pool = []
    const byId = new Map()
    for (const task of tasks) {
      byId.set(task.id, task)
      if (!activeList || task.listId !== activeList.id) continue
      if (task.date) {
        if (!dayTasks.has(task.date)) dayTasks.set(task.date, [])
        dayTasks.get(task.date).push(task)
      } else {
        pool.push(task)
      }
    }
    return { dayTasksMap: dayTasks, poolTasks: pool, taskById: byId }
  }, [tasks, activeList])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
  )

  const registerRef = (key, node) => {
    if (node) dayNodes.current.set(key, node)
    else dayNodes.current.delete(key)
  }

  const scrollToToday = (behavior = 'smooth') => {
    const node = dayNodes.current.get(today)
    if (node) node.scrollIntoView({ block: 'start', behavior })
  }

  useEffect(() => {
    const timer = setTimeout(() => scrollToToday('auto'), 80)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDragStart = (event) => setDraggingId(String(event.active.id))

  const handleDragEnd = (event) => {
    setDraggingId(null)
    suppressClickAfterDrag()
    const { active, over } = event
    if (!over) return
    const id = String(active.id)
    const overId = String(over.id)
    if (overId === 'pool') {
      dispatch({ type: 'scheduleTask', id, date: null })
      return
    }
    if (overId.startsWith('day:')) {
      dispatch({ type: 'scheduleTask', id, date: overId.slice(4), listId: activeList?.id })
    }
  }

  const toggleTask = (task) => dispatch({ type: 'toggleTask', id: task.id })

  const addTask = (title, date) =>
    dispatch({ type: 'addTask', title, date, listId: activeList?.id })

  const draggingTask = draggingId ? taskById.get(draggingId) : null
  const todayTasks = dayTasksMap.get(today) ?? []
  const doneToday = todayTasks.filter((t) => t.done).length

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggingId(null)}
    >
      <div className="relative flex h-full min-h-0 flex-col">
        {/* 顶部栏 */}
        <header className="safe-top z-10 shrink-0 px-4 pb-2.5 pt-4">
          <div className="flex items-center gap-2">
            <h1 className="text-[21px] font-bold tracking-tight text-mist-50">
              {monthLabel(today)}
            </h1>
            <button
              type="button"
              onClick={() => scrollToToday()}
              className="press ml-auto rounded-full border border-ink-700 px-3 py-1.5 text-xs font-medium text-brand-400 active:bg-ink-850"
            >
              今天
            </button>
          </div>
          <p className="mt-1 text-[11px] text-mist-500">
            今天 {doneToday}/{todayTasks.length} 已完成
          </p>
        </header>

        {/* 左右两栏 */}
        <div className="flex min-h-0 flex-1">
          {/* 左栏：日期卡片 */}
          <section className="no-scrollbar min-w-0 flex-1 space-y-2 overflow-y-auto px-4 pb-28 pt-1">
            <button
              type="button"
              onClick={() => setRangeStart((k) => shiftKey(k, -14))}
              className="press w-full rounded-xl border border-dashed border-ink-700 py-2 text-[11px] text-mist-500 active:bg-ink-850"
            >
              查看更早日期
            </button>

            {days.map((dayKey) => (
              <DayCard
                key={dayKey}
                dayKey={dayKey}
                tasks={dayTasksMap.get(dayKey) ?? []}
                isToday={dayKey === today}
                onOpenDay={onOpenDayDetail}
                onToggle={toggleTask}
                onOpenActions={onOpenTaskActions}
                onAddTask={addTask}
                registerRef={registerRef}
              />
            ))}

            <button
              type="button"
              onClick={() => setRangeEnd((k) => shiftKey(k, 14))}
              className="press w-full rounded-xl border border-dashed border-ink-700 py-2 text-[11px] text-mist-500 active:bg-ink-850"
            >
              查看更多日期
            </button>
          </section>

          {/* 右栏：待执行清单 */}
          <PoolColumn
            tasks={poolTasks}
            lists={lists}
            activeListId={activeList?.id}
            onSwitchList={(id) => dispatch({ type: 'setActiveList', id })}
            onToggle={toggleTask}
            onOpenActions={onOpenTaskActions}
            onAddTask={addTask}
          />
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {draggingTask ? (
          <div className="flex max-w-[220px] items-center gap-2 rounded-lg border border-brand-500/70 bg-ink-800 px-2.5 py-2 shadow-xl shadow-black/50">
            <span className="h-[20px] w-[20px] shrink-0 rounded-full border-2 border-brand-500" />
            <span className="truncate text-[13px] text-mist-50">{draggingTask.title}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
