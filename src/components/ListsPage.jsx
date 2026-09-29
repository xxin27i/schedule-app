import { useEffect, useState } from 'react'
import { LIST_COLORS, useStore } from '../lib/store'
import {
  Button,
  ColorPicker,
  EditIcon,
  Field,
  PlusIcon,
  ProgressRing,
  Sheet,
  StarIcon,
  TrashIcon,
  inputClass,
} from './ui'

function ListEditor({ open, list, onClose }) {
  const { dispatch } = useStore()
  const [name, setName] = useState('')
  const [color, setColor] = useState(LIST_COLORS[0])

  useEffect(() => {
    if (!open) return
    setName(list?.name ?? '')
    setColor(list?.color ?? LIST_COLORS[Math.floor(Math.random() * LIST_COLORS.length)])
  }, [open, list])

  const save = () => {
    if (!name.trim()) return
    if (list) dispatch({ type: 'updateList', id: list.id, patch: { name: name.trim(), color } })
    else dispatch({ type: 'addList', name, color })
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={list ? '编辑清单' : '新建清单'}
      footer={
        <Button className="w-full" onClick={save} disabled={!name.trim()}>
          {list ? '保存修改' : '创建清单'}
        </Button>
      }
    >
      <div className="space-y-5">
        <Field label="清单名称">
          <input
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="例如：工作 / 学习 / 生活"
            className={inputClass}
          />
        </Field>
        <Field label="颜色标识">
          <ColorPicker value={color} onChange={setColor} colors={LIST_COLORS} />
        </Field>
      </div>
    </Sheet>
  )
}

function ListDeleter({ list, onClose }) {
  const { lists, tasks, dispatch } = useStore()
  const [strategy, setStrategy] = useState('delete')
  const others = lists.filter((l) => l.id !== list?.id)
  const [target, setTarget] = useState(others[0]?.id ?? '')

  useEffect(() => {
    setStrategy('delete')
    setTarget(others[0]?.id ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list])

  if (!list) return null
  const count = tasks.filter((t) => t.listId === list.id).length

  return (
    <Sheet
      open
      onClose={onClose}
      title="删除清单"
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              dispatch({
                type: 'deleteList',
                id: list.id,
                strategy,
                moveToListId: strategy === 'move' ? target : null,
              })
              onClose()
            }}
          >
            确认删除
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-mist-300">
          即将删除清单「<span className="text-mist-50">{list.name}</span>」，其中包含{' '}
          <span className="tabular-nums text-mist-50">{count}</span> 个任务。
        </p>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setStrategy('delete')}
            className={`flex w-full items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-left ${
              strategy === 'delete'
                ? 'border-brand-400/60 bg-brand-400/10'
                : 'border-ink-700 active:bg-ink-850'
            }`}
          >
            <span
              className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${
                strategy === 'delete' ? 'border-brand-400' : 'border-ink-600'
              }`}
            >
              {strategy === 'delete' ? (
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              ) : null}
            </span>
            <span>
              <span className="block text-sm text-mist-100">同时删除清单内所有任务</span>
              <span className="mt-0.5 block text-[11px] text-mist-500">
                推荐用于清理不需要的清单
              </span>
            </span>
          </button>

          <div
            className={`rounded-2xl border ${
              strategy === 'move' ? 'border-brand-500 bg-brand-500/10' : 'border-ink-700'
            }`}
          >
            <button
              type="button"
              disabled={others.length === 0}
              onClick={() => setStrategy('move')}
              className="flex w-full items-start gap-2.5 px-3.5 py-3 text-left disabled:opacity-40"
            >
              <span
                className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${
                  strategy === 'move' ? 'border-brand-400' : 'border-ink-600'
                }`}
              >
                {strategy === 'move' ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-mist-100">把任务移动到其他清单</span>
                <span className="mt-0.5 block text-[11px] text-mist-500">
                  {others.length === 0 ? '没有其他清单可选' : '保留任务，仅改变归属清单'}
                </span>
              </span>
            </button>
            {others.length > 0 && strategy === 'move' ? (
              <div className="px-3.5 pb-3">
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full rounded-xl border border-ink-700 bg-ink-850 px-3 py-2 text-[13px] text-mist-100 outline-none"
                >
                  {others.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Sheet>
  )
}

export default function ListsPage() {
  const { lists, tasks, activeList, dispatch } = useStore()
  const [editing, setEditing] = useState(null) // { list } | { create: true } | null
  const [deleting, setDeleting] = useState(null)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="safe-top shrink-0 px-4 pb-2 pt-4">
        <div className="flex items-baseline gap-2">
          <h1 className="text-[22px] font-semibold tracking-tight text-mist-50">我的清单</h1>
          <span className="text-[11px] text-mist-500">共 {lists.length} 个 · 数据存本机</span>
        </div>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-6 pt-2">
        {lists.map((list) => {
          const items = tasks.filter((t) => t.listId === list.id)
          const done = items.filter((t) => t.done).length
          const scheduled = items.filter((t) => t.date).length
          const isActive = activeList?.id === list.id

          return (
            <div
              key={list.id}
              className={`rounded-[20px] border bg-ink-850 p-4 transition-colors ${
                isActive ? 'border-brand-500/60' : 'border-ink-750/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: list.color }}
                />
                <h2 className="min-w-0 flex-1 truncate text-[16px] font-semibold tracking-tight text-mist-50">
                  {list.name}
                </h2>
                {isActive ? (
                  <span className="shrink-0 rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-semibold text-brand-300">
                    首页展示
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex items-center gap-4">
                <ProgressRing value={done} total={items.length} color={list.color} />
                <div className="min-w-0">
                  <p className="text-[13px] text-mist-100">
                    已完成 <span className="font-semibold tabular-nums">{done}</span>
                    <span className="text-mist-500">
                      {' '}
                      / <span className="tabular-nums">{items.length}</span>
                    </span>
                  </p>
                  <p className="mt-1 text-[11px] text-mist-500">
                    待执行 <span className="tabular-nums">{items.length - scheduled}</span>
                    <span className="mx-1.5 text-ink-600">|</span>
                    已排期 <span className="tabular-nums">{scheduled}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  disabled={isActive}
                  onClick={() => dispatch({ type: 'setActiveList', id: list.id })}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-ink-800 text-mist-500'
                      : 'bg-brand-500/15 text-brand-300 active:bg-brand-500/25'
                  }`}
                >
                  <StarIcon className="h-3.5 w-3.5" filled={isActive} />
                  {isActive ? '当前首页' : '设为首页展示'}
                </button>

                <button
                  type="button"
                  onClick={() => setEditing(list)}
                  aria-label={`编辑 ${list.name}`}
                  className="ml-auto rounded-full bg-ink-800 p-2.5 text-mist-300 active:bg-ink-750"
                >
                  <EditIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={lists.length <= 1}
                  onClick={() => setDeleting(list)}
                  aria-label={`删除 ${list.name}`}
                  className="rounded-full bg-ink-800 p-2.5 text-brand-400 active:bg-brand-400/15 disabled:opacity-30"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}

        <button
          type="button"
          onClick={() => setEditing({ create: true })}
          className="flex w-full items-center justify-center gap-2 rounded-[20px] border border-dashed border-ink-700 py-4 text-sm text-mist-300 active:bg-ink-850"
        >
          <PlusIcon className="h-4 w-4" />
          新建清单
        </button>
      </div>

      <ListEditor
        open={Boolean(editing)}
        list={editing?.create ? null : editing}
        onClose={() => setEditing(null)}
      />
      {deleting ? <ListDeleter list={deleting} onClose={() => setDeleting(null)} /> : null}
    </div>
  )
}
