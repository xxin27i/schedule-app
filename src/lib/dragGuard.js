/** 拖拽结束后短时间内抑制 click，避免"拖完顺手弹窗" */
export const dragGuard = { lastEnd: 0 }

export function suppressClickAfterDrag() {
  dragGuard.lastEnd = Date.now()
}

export function isDragJustEnded() {
  return Date.now() - dragGuard.lastEnd < 220
}
