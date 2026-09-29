import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { todayKey, shiftKey } from './date'

const STORAGE_KEY = 'schedule-app:v1'

export const LIST_COLORS = [
  '#6c8cff',
  '#4ade9f',
  '#f0a35e',
  '#e879a6',
  '#a78bfa',
  '#38bdf8',
  '#facc15',
  '#fb7185',
]

export function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function nextOrder(tasks) {
  return tasks.reduce((max, t) => Math.max(max, t.order ?? 0), 0) + 1
}

/** 首次启动的示例数据，便于直接验证链路 */
function createSeedState() {
  const listId = uid()
  const now = Date.now()
  const today = todayKey()
  const build = (title, order, date = null, done = false) => ({
    id: uid(),
    listId,
    title,
    done,
    date,
    createdAt: now + order,
    completedAt: done ? now + order : null,
    order,
  })

  return {
    lists: [{ id: listId, name: '我的任务', color: LIST_COLORS[0], createdAt: now }],
    tasks: [
      build('把任务拖到左侧某一天', 1),
      build('点圆圈标记完成', 2),
      build('点标题可安排日期', 3),
      build('早晨跑步 30 分钟', 4, today, true),
      build('整理本周工作计划', 5, today, false),
    ],
    activeListId: listId,
    seeded: true,
  }
}

function normalize(raw) {
  if (!raw || typeof raw !== 'object') return null
  const lists = Array.isArray(raw.lists) ? raw.lists : []
  if (lists.length === 0) return null

  const listIds = new Set(lists.map((l) => l.id))
  const tasks = (Array.isArray(raw.tasks) ? raw.tasks : [])
    .filter((t) => t && typeof t.title === 'string' && listIds.has(t.listId))
    .map((t, i) => ({
      id: t.id || uid(),
      listId: t.listId,
      title: t.title,
      done: Boolean(t.done),
      date: typeof t.date === 'string' ? t.date : null,
      createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now() + i,
      completedAt: typeof t.completedAt === 'number' ? t.completedAt : null,
      order: typeof t.order === 'number' ? t.order : i + 1,
    }))

  const activeListId = listIds.has(raw.activeListId) ? raw.activeListId : lists[0].id

  return { lists, tasks, activeListId, seeded: Boolean(raw.seeded) }
}

function loadState() {
  if (typeof localStorage === 'undefined') return createSeedState()
  try {
    const text = localStorage.getItem(STORAGE_KEY)
    if (!text) return createSeedState()
    return normalize(JSON.parse(text)) ?? createSeedState()
  } catch (err) {
    console.warn('[store] 本地数据读取失败，已重置为示例数据', err)
    return createSeedState()
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'addList': {
      const list = {
        id: uid(),
        name: action.name.trim() || '未命名清单',
        color: action.color || LIST_COLORS[state.lists.length % LIST_COLORS.length],
        createdAt: Date.now(),
      }
      return { ...state, lists: [...state.lists, list], activeListId: list.id }
    }

    case 'updateList': {
      return {
        ...state,
        lists: state.lists.map((l) => (l.id === action.id ? { ...l, ...action.patch } : l)),
      }
    }

    case 'deleteList': {
      const remaining = state.lists.filter((l) => l.id !== action.id)
      if (remaining.length === 0) return state

      let tasks
      if (action.strategy === 'move' && action.moveToListId && action.moveToListId !== action.id) {
        const targetId = action.moveToListId
        let cursor = nextOrder(state.tasks.filter((t) => t.listId === targetId))
        tasks = state.tasks
          .filter((t) => t.listId !== action.id)
          .concat(
            state.tasks
              .filter((t) => t.listId === action.id)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((t) => ({ ...t, listId: targetId, order: cursor++ })),
          )
      } else {
        tasks = state.tasks.filter((t) => t.listId !== action.id)
      }

      const activeListId =
        state.activeListId === action.id ? remaining[0].id : state.activeListId
      return { ...state, lists: remaining, tasks, activeListId }
    }

    case 'setActiveList': {
      if (!state.lists.some((l) => l.id === action.id)) return state
      return { ...state, activeListId: action.id }
    }

    case 'addTask': {
      const listId = action.listId || state.activeListId
      if (!listId) return state
      const task = {
        id: uid(),
        listId,
        title: action.title.trim(),
        done: false,
        date: action.date ?? null,
        createdAt: Date.now(),
        completedAt: null,
        order: nextOrder(state.tasks),
      }
      if (!task.title) return state
      return { ...state, tasks: [...state.tasks, task] }
    }

    case 'addTasks': {
      const listId = action.listId || state.activeListId
      if (!listId) return state
      const titles = (action.titles || []).map((t) => String(t).trim()).filter(Boolean)
      if (titles.length === 0) return state
      let cursor = nextOrder(state.tasks)
      const created = titles.map((title) => ({
        id: uid(),
        listId,
        title,
        done: false,
        date: action.date ?? null,
        createdAt: Date.now(),
        completedAt: null,
        order: cursor++,
      }))
      return { ...state, tasks: [...state.tasks, ...created] }
    }

    case 'updateTask': {
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)),
      }
    }

    case 'toggleTask': {
      const now = Date.now()
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, done: !t.done, completedAt: !t.done ? now : null } : t,
        ),
      }
    }

    case 'deleteTask': {
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) }
    }

    /** 在「清单任务」与「某天日程」之间移动：date 为 null 表示回到清单池 */
    case 'scheduleTask': {
      const target = action.date ?? null
      let cursor = target
        ? nextOrder(state.tasks.filter((t) => t.date === target && t.id !== action.id))
        : nextOrder(state.tasks.filter((t) => t.listId === action.listId && !t.date))
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, date: target, order: cursor++ } : t,
        ),
      }
    }

    case 'clearCompleted': {
      return {
        ...state,
        tasks: state.tasks.filter((t) => !(t.listId === action.listId && t.done)),
      }
    }

    case 'resetAll': {
      return createSeedState()
    }

    default:
      return state
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const skipPersist = useRef(false)

  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false
      return
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (err) {
      console.warn('[store] 本地数据写入失败', err)
    }
  }, [state])

  const value = useMemo(() => {
    const lists = state.lists
    const tasks = [...state.tasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const activeList = lists.find((l) => l.id === state.activeListId) ?? lists[0] ?? null

    const listTasks = (listId) => tasks.filter((t) => t.listId === listId)
    const poolTasks = activeList ? tasks.filter((t) => t.listId === activeList.id && !t.date) : []
    const tasksOnDate = (key) => tasks.filter((t) => t.date === key)
    const listTasksOnDate = (key) =>
      activeList ? tasks.filter((t) => t.date === key && t.listId === activeList.id) : []

    return {
      lists,
      tasks,
      activeList,
      poolTasks,
      listTasks,
      tasksOnDate,
      listTasksOnDate,
      dispatch,
    }
  }, [state])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore 必须在 StoreProvider 内使用')
  return ctx
}

export { todayKey, shiftKey }
