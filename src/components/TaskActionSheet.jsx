import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import { dayNumber, keyRange, relativeLabel, shiftKey, todayKey } from '../lib/date'
import { Button, CalendarIcon, CheckIcon, EditIcon, Sheet, TrashIcon, inputClass } from './ui'

function MenuItem({ icon, title, desc, onClick, tone = 'default' }) {
  const color = tone === 'danger' ? 'text-brand-400' : 'text-mist-100'
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-ink-850 px-4 py-3 text-left active:bg-ink-800"
    >
      <span className={`shrink-0 ${color}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm ${color}`}>{title}</span>
        {desc ? <span className="mt-0.5 block text-[11px] text-mist-500">{desc}</span> : null}
      </span>
    </button>
  )
}

/**
 * 任务操作面板：手机上不方便拖拽时的替代交互。
 * 点任务文字即可在这里安排日期 / 移回清单 / 改名 / 删除。
 */
export default function TaskActionSheet({ task, onClose }) {
  const { dispatch } = useStore()
  const [mode, setMode] = useState('menu')
  const [title, setTitle] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (task) {
      setMode('menu')
      setTitle(task.title)
      setConfirmDelete(false)
    }
  }, [task])

  if (!task) return null

  const pickerDays = [
    todayKey(),
    shiftKey(todayKey(), 1),
    ...keyRange(shiftKey(todayKey(), 2), 12),
  ]

  const schedule = (date) => {
    dispatch({ type: 'scheduleTask', id: task.id, date, listId: task.listId })
    onClose()
  }

  return (
    <Sheet open title={task.title} onClose={onClose}>
      {mode === 'menu' ? (
        <div className="space-y-2">
          <p className="px-1 pb-1 text-[11px] text-mist-500">
            {task.date ? `已安排在 ${relativeLabel(task.date)}` : '当前在清单池中，未安排日期'}
          </p>

          <MenuItem
            icon={<CalendarIcon className="h-5 w-5" />}
            title="安排日期…"
            desc="选择具体某一天"
            onClick={() => setMode('date')}
          />

          {task.date ? (
            <MenuItem
              icon={<CalendarIcon className="h-5 w-5" />}
              title="移回清单"
              desc="重新放回待执行池"
              onClick={() => schedule(null)}
            />
          ) : null}

          <MenuItem
            icon={<EditIcon className="h-5 w-5" />}
            title="编辑标题"
            onClick={() => setMode('edit')}
          />

          <MenuItem
            icon={<CheckIcon className="h-5 w-5" />}
            title={task.done ? '标记为未完成' : '标记为已完成'}
            onClick={() => dispatch({ type: 'toggleTask', id: task.id })}
          />

          {confirmDelete ? (
            <div className="space-y-2 rounded-2xl border border-brand-400/40 bg-brand-400/10 p-3">
              <p className="text-xs text-brand-400">确定删除该任务？此操作不可撤销。</p>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => {
                    dispatch({ type: 'deleteTask', id: task.id })
                    onClose()
                  }}
                >
                  确认删除
                </Button>
                <Button variant="ghost" className="flex-1" onClick={() => setConfirmDelete(false)}>
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <MenuItem
              icon={<TrashIcon className="h-5 w-5" />}
              title="删除任务"
              tone="danger"
              onClick={() => setConfirmDelete(true)}
            />
          )}
        </div>
      ) : null}

      {mode === 'date' ? (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {pickerDays.map((dayKey) => {
              const selected = task.date === dayKey
              return (
                <button
                  key={dayKey}
                  type="button"
                  onClick={() => schedule(dayKey)}
                  className={`rounded-2xl border px-1 py-2.5 text-center transition-colors ${
                    selected
                      ? 'border-brand-500 bg-brand-500/15 text-brand-300'
                      : 'border-ink-700 text-mist-200 active:bg-ink-850'
                  }`}
                >
                  <span className="block text-[13px] font-semibold tabular-nums">
                    {dayNumber(dayKey)}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-mist-500">
                    {relativeLabel(dayKey)}
                  </span>
                </button>
              )
            })}
          </div>

          <label className="block rounded-2xl bg-ink-850 px-4 py-3">
            <span className="mb-1 block text-[11px] text-mist-400">或选择任意日期</span>
            <input
              type="date"
              value={task.date ?? ''}
              onChange={(e) => e.target.value && schedule(e.target.value)}
              className="w-full bg-transparent text-sm text-mist-100 outline-none"
            />
          </label>

          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setMode('menu')}>
              返回
            </Button>
            {task.date ? (
              <Button variant="outline" className="flex-1" onClick={() => schedule(null)}>
                移回清单
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {mode === 'edit' ? (
        <div className="space-y-3">
          <input
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && title.trim()) {
                dispatch({ type: 'updateTask', id: task.id, patch: { title: title.trim() } })
                onClose()
              }
            }}
            className={inputClass}
          />
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setMode('menu')}>
              返回
            </Button>
            <Button
              className="flex-1"
              disabled={!title.trim()}
              onClick={() => {
                dispatch({ type: 'updateTask', id: task.id, patch: { title: title.trim() } })
                onClose()
              }}
            >
              <CheckIcon className="mr-1 inline h-4 w-4" />
              保存
            </Button>
          </div>
        </div>
      ) : null}
    </Sheet>
  )
}
