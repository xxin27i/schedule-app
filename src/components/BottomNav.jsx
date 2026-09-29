import { BookIcon, CalendarIcon, StackIcon } from './ui'

const TABS = [
  { key: 'schedule', label: '日程', Icon: CalendarIcon },
  { key: 'book', label: '计划书', Icon: BookIcon },
  { key: 'lists', label: '清单', Icon: StackIcon },
]

/**
 * 底部导航：用一条会滑动的指示条代替「整块背景切换」，
 * 位移动画走合成器，切页时不会掉帧。
 */
export default function BottomNav({ tab, onChange }) {
  const index = Math.max(
    0,
    TABS.findIndex((t) => t.key === tab),
  )

  return (
    <nav className="safe-bottom shrink-0 px-4 pb-3 pt-2">
      <div className="relative flex items-center rounded-[22px] border border-ink-800 bg-ink-850 p-1.5">
        <span
          aria-hidden="true"
          className="nav-indicator pointer-events-none absolute inset-y-1.5 left-1.5 rounded-[16px] bg-ink-800"
          style={{
            width: `calc((100% - 0.75rem) / ${TABS.length})`,
            transform: `translateX(${index * 100}%)`,
          }}
        />

        {TABS.map(({ key, label, Icon }) => {
          const active = tab === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-current={active ? 'page' : undefined}
              className={`relative z-10 flex flex-1 flex-col items-center gap-0.5 rounded-[16px] py-2 ${
                active ? 'text-brand-400' : 'text-mist-500 active:scale-[0.96]'
              }`}
            >
              <Icon className="h-[21px] w-[21px]" />
              <span className="text-[10.5px] font-medium tracking-tight">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
