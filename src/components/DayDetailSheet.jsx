import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import { dayNumber, relativeLabel, todayKey, weekdayLabel } from '../lib/date'
import { Button, EmptyState, PlusIcon, Sheet, TaskCircle, inputClass } from './ui'

/** 点击某一天：查看 / 编辑该天全部任务 */
export default function DayDetailSheet({ dayKey, onClose }) {
  const { activeList, tasks, dispatch } = useStore()
  const [draft, setDraft] = useState('')

  useEffect(() => {
    setDraft('')
  }, [dayKey])

  const dayTasks = tasks.filter(
    (t) => t.date === dayKey && (!activeList || t.listId === activeList.id),
  )
  const done = dayTasks.filter((t) => t.done).length

  const add = () => {
    if (!draft.trim()) return
    dispatch({ type: 'addTask', title: draft, date: dayKey, listId: activeList?.id })
    setDraft('')
  }

  return (
    <Sheet
      open={Boolean(dayKey)}
      onClose={onClose}
      title={
        dayKey
          ? `${dayNumber(dayKey)} 日 · ${weekdayLabel(dayKey)}${
              dayKey === todayKey() ? ' · 今天' : ` · ${relativeLabel(dayKey)}`
            }`
          : ''
      }
    >
      {dayKey ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[11px] text-mist-500">
            <span>共 {dayTasks.length} 项</span>
            <span className="tabular-nums">
              已完成 {done}/{dayTasks.length}
            </span>
          </div>

          <div className="space-y-1">
            {dayTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 rounded-2xl bg-ink-850 px-3 py-2.5"
              >
                <TaskCircle
                  done={task.done}
                  onToggle={() => dispatch({ type: 'toggleTask', id: task.id })}
                />
                <span
                  className={`min-w-0 flex-1 truncate text-[13.5px] ${
                    task.done ? 'text-mist-500 line-through' : 'text-mist-100'
                  }`}
                >
                  {task.title}
                </span>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'scheduleTask', id: task.id, date: null })}
                  className="shrink-0 rounded-full px-2.5 py-1 text-[11px] text-mist-400 active:bg-ink-800"
                >
                  移回清单
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'deleteTask', id: task.id })}
                  className="shrink-0 rounded-full px-2.5 py-1 text-[11px] text-brand-400 active:bg-brand-400/10"
                >
                  删除
                </button>
              </div>
            ))}

            {dayTasks.length === 0 ? (
              <EmptyState>这一天还没有任务，可以从右侧清单拖过来，或在下方直接添加。</EmptyState>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') add()
              }}
              placeholder="添加到这一天…"
              className={inputClass}
            />
            <Button onClick={add} disabled={!draft.trim()} className="shrink-0">
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>

          {done > 0 ? (
            <button
              type="button"
              onClick={() => {
                for (const t of dayTasks.filter((t) => t.done)) {
                  dispatch({ type: 'scheduleTask', id: t.id, date: null })
                }
              }}
              className="w-full rounded-2xl border border-ink-700 py-2.5 text-xs text-mist-300 active:bg-ink-850"
            >
              把已完成的 {done} 项移回清单
            </button>
          ) : null}
        </div>
      ) : null}
    </Sheet>
  )
}
