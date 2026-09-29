import { useEffect, useRef, useState } from 'react'

/* ---------------------------------- 图标 ---------------------------------- */

export function CheckIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 12.5l4.2 4.2L19 7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CalendarIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3.5 10.5h17M8.5 3.5v3M15.5 3.5v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** 计划书 */
export function BookIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 6.6C10.5 5.2 8.3 4.6 5 4.6a.9.9 0 0 0-.9.9v11.2c0 .5.4.9.9.9 3.1 0 5.2.5 7 1.8 1.8-1.3 3.9-1.8 7-1.8a.9.9 0 0 0 .9-.9V5.5a.9.9 0 0 0-.9-.9c-3.3 0-5.5.6-7 2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 6.6v12.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function StackIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="6" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3.5" y="14.5" width="17" height="6" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export function PlusIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export function CloseIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export function ChevronLeftIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M14.5 5.5L8 12l6.5 6.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ChevronRightIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M9.5 5.5L16 12l-6.5 6.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ChevronDownIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6.5 9.5L12 15l5.5-5.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function DotsIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="12" cy="5.5" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="12" cy="18.5" r="1.7" />
    </svg>
  )
}

export function TrashIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4.5 7h15M9.5 7V4.8c0-.4.3-.8.8-.8h3.4c.5 0 .8.4.8.8V7M6.5 7l.9 12.2c0 .5.4.8.9.8h7.4c.5 0 .9-.3.9-.8L17.5 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function EditIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 20h4.2L20 8.2 15.8 4 4 15.8V20z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function StarIcon({ className = '', filled = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 4l2.5 5.1 5.6.8-4 3.9 1 5.6L12 16.8 6.9 19.4l1-5.6-4-3.9 5.6-.8L12 4z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* --------------------------------- 基础组件 --------------------------------- */

/**
 * 完成任务用的圆圈（对齐参考图）：
 * 未完成 = 灰色空心圆；完成 = 填充强调色 + 白色对勾，并有一次轻快的回弹。
 */
export function TaskCircle({ done, onToggle, size = 'md', label, tone = 'dark' }) {
  const dim = size === 'sm' ? 'h-[18px] w-[18px]' : 'h-[22px] w-[22px]'
  const idle =
    tone === 'paper'
      ? 'border-paper-soft/70'
      : 'border-ink-600 active:border-brand-500'
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      aria-label={label || (done ? '标记为未完成' : '标记为完成')}
      aria-pressed={done}
      className={`${dim} press-sm grid shrink-0 place-items-center rounded-full border-2 ${
        done
          ? tone === 'paper'
            ? 'border-paper-check bg-paper-check text-white'
            : 'border-brand-500 bg-brand-500 text-white'
          : idle
      }`}
    >
      {done ? (
        <CheckIcon className={`animate-check ${size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
      ) : null}
    </button>
  )
}

/**
 * 清单下拉框：原生 select，移动端直接唤起系统选择器，切换最省事。
 */
export function ListSelect({ lists, value, onChange, className = '', prominent = false }) {
  const active = lists.find((l) => l.id === value)
  return (
    <div className={`relative flex items-center ${className}`}>
      <span
        className="pointer-events-none absolute left-2.5 h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: active?.color ?? '#F8D77C' }}
      />
      <select
        aria-label="切换清单"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={`field-reset w-full cursor-pointer truncate rounded-lg py-1.5 pl-7 pr-6 font-semibold text-mist-50 ${
          prominent ? 'bg-ink-800 text-[13px] active:bg-ink-750' : 'bg-ink-800/70 text-[12.5px]'
        }`}
      >
        {lists.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-1 h-3.5 w-3.5 text-mist-400" />
    </div>
  )
}

/**
 * 行内添加任务：点一下就地长出「小圆圈 + 输入框」，不再弹窗。
 * Enter 提交后保持打开，方便连着录入；失焦/取消则收起。
 */
export function InlineAddTask({
  onSubmit,
  placeholder = '添加任务',
  compact = false,
  itemClassName = '',
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const commit = (keepOpen) => {
    const title = value.trim()
    if (title) onSubmit(title)
    setValue('')
    if (!keepOpen) setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`press flex w-full items-center gap-2.5 rounded-lg px-2 text-left text-mist-500 active:bg-ink-800 ${
          compact ? 'py-1.5' : 'py-2'
        }`}
      >
        <span className="grid h-[18px] w-[18px] shrink-0 place-items-center">
          <PlusIcon className="h-4 w-4 text-brand-400" />
        </span>
        <span className={compact ? 'text-[12px]' : 'text-[13px]'}>{placeholder}</span>
      </button>
    )
  }

  return (
    <div
      className={`animate-row flex items-center gap-2.5 rounded-lg px-2 ${
        compact ? 'py-1.5' : 'py-2'
      } ${itemClassName}`}
    >
      <span className="h-[18px] w-[18px] shrink-0 rounded-full border-2 border-ink-600" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit(true)
          } else if (e.key === 'Escape') {
            setValue('')
            setOpen(false)
          }
        }}
        onBlur={() => commit(false)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[13px] text-mist-50 outline-none placeholder:text-mist-500"
      />
    </div>
  )
}

export function ProgressBar({ value, total, color = '#F8D77C', className = '' }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-ink-750 ${className}`}>
      <div
        className="h-full rounded-full transition-[width] duration-300 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

export function ProgressRing({ value, total, color = '#F8D77C', size = 52, stroke = 4 }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#3d3d3d" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          style={{ transition: 'stroke-dashoffset .35s cubic-bezier(.22,.72,.24,1)' }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[12px] font-semibold tabular-nums text-mist-50">
        {pct}%
      </span>
    </div>
  )
}

export function Button({ variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-brand-500 text-white font-semibold active:bg-brand-600',
    ghost: 'bg-ink-800 text-mist-100 active:bg-ink-750',
    danger: 'bg-brand-400/15 text-brand-400 active:bg-brand-400/25',
    outline: 'border border-ink-600 text-mist-100 active:bg-ink-800',
  }[variant]
  return (
    <button
      type="button"
      className={`press rounded-xl px-4 py-3 text-sm disabled:opacity-40 ${styles} ${className}`}
      {...props}
    />
  )
}

/* ---------------------------------- 弹层 ---------------------------------- */

export function Sheet({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="animate-fade absolute inset-0 bg-black/65"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet relative max-h-[88vh] w-full overflow-hidden rounded-t-[20px] border border-ink-750 bg-ink-900 shadow-2xl shadow-black/60 sm:max-w-md sm:rounded-[20px]"
      >
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
          <h2 className="text-[17px] font-semibold tracking-tight text-mist-50">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="press-sm -mr-1.5 rounded-full p-1.5 text-mist-400 active:bg-ink-800"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="no-scrollbar max-h-[62vh] overflow-y-auto px-5 pb-4">{children}</div>
        {footer ? (
          <div className="safe-bottom border-t border-ink-800 px-5 py-3">{footer}</div>
        ) : null}
      </div>
    </div>
  )
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-mist-400">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-[11px] text-mist-500">{hint}</span> : null}
    </label>
  )
}

export const inputClass =
  'w-full rounded-xl border border-ink-700 bg-ink-850 px-4 py-3 text-mist-50 placeholder:text-mist-500 outline-none transition-colors focus:border-brand-500'

export function ColorPicker({ value, onChange, colors }) {
  return (
    <div className="flex flex-wrap gap-3">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={`选择颜色 ${c}`}
          aria-pressed={value === c}
          className={`press-sm h-9 w-9 rounded-full ${
            value === c ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-ink-900' : 'opacity-85'
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  )
}

export function EmptyState({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-ink-700 px-4 py-6 text-center text-xs leading-relaxed text-mist-500">
      {children}
    </div>
  )
}
