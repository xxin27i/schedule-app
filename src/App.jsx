import { useDeferredValue, useState } from 'react'
import { StoreProvider } from './lib/store'
import BottomNav from './components/BottomNav'
import SchedulePage from './components/SchedulePage'
import PlanBook from './components/PlanBook'
import ListsPage from './components/ListsPage'
import DayDetailSheet from './components/DayDetailSheet'
import TaskActionSheet from './components/TaskActionSheet'

function Shell() {
  const [tab, setTab] = useState('schedule')
  const [detailDay, setDetailDay] = useState(null)
  const [actionTask, setActionTask] = useState(null)

  // 导航指示条用紧急状态立即响应；页面内容用延迟值，切换时不会卡住输入
  const pageTab = useDeferredValue(tab)

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col bg-ink-950 sm:border-x sm:border-ink-850">
      <main className="min-h-0 flex-1 overflow-hidden">
        <div key={pageTab} className="animate-page h-full">
          {pageTab === 'schedule' ? (
            <SchedulePage
              onOpenDayDetail={setDetailDay}
              onOpenTaskActions={setActionTask}
            />
          ) : null}
          {pageTab === 'book' ? <PlanBook /> : null}
          {pageTab === 'lists' ? <ListsPage /> : null}
        </div>
      </main>

      <BottomNav tab={tab} onChange={setTab} />

      <DayDetailSheet dayKey={detailDay} onClose={() => setDetailDay(null)} />
      <TaskActionSheet task={actionTask} onClose={() => setActionTask(null)} />
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
