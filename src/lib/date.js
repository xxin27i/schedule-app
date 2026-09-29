export const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** 本地日期 -> 'YYYY-MM-DD' */
export function toKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 'YYYY-MM-DD' -> 本地 Date（零点） */
export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey() {
  return toKey(new Date())
}

export function addDays(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() + n)
  return d
}

export function shiftKey(key, n) {
  return toKey(addDays(fromKey(key), n))
}

/** 以周一为一周起点，生成从 startKey 开始、共 count 天的 key 数组 */
export function keyRange(startKey, count) {
  const out = []
  let cursor = fromKey(startKey)
  for (let i = 0; i < count; i += 1) {
    out.push(toKey(cursor))
    cursor = addDays(cursor, 1)
  }
  return out
}

export function weekdayLabel(key) {
  return WEEKDAYS[fromKey(key).getDay()]
}

export function dayNumber(key) {
  return fromKey(key).getDate()
}

export function monthLabel(key) {
  const d = fromKey(key)
  return `${d.getFullYear()}年${d.getMonth() + 1}月`
}

export function shortLabel(key) {
  const d = fromKey(key)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** 相对今天的友好描述：今天 / 明天 / 3天后 / 昨天 */
export function relativeLabel(key) {
  const today = todayKey()
  if (key === today) return '今天'
  const diff = Math.round((fromKey(key) - fromKey(today)) / 86400000)
  if (diff === 1) return '明天'
  if (diff === -1) return '昨天'
  if (diff > 1 && diff <= 6) return `${diff}天后`
  if (diff < -1 && diff >= -6) return `${-diff}天前`
  return shortLabel(key)
}
