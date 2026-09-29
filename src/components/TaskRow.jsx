import { useDraggable } from '@dnd-kit/core'
import { TaskCircle } from './ui'
import { isDragJustEnded } from '../lib/dragGuard'

/**
 * 可拖拽的任务行（扁平行式，对齐参考图）：
 * 整行拖动，点圆圈切换完成，点文字打开操作面板。
 */
export default function TaskRow({
  task,
  onToggle,
  onOpenActions,
  compact = false,
  divided = false,
  accent,
  className = '',
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id })

  const handleOpen = () => {
    if (isDragJustEnded()) return
    onOpenActions?.(task)
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={handleOpen}
      style={{ touchAction: 'manipulation' }}
      data-task-id={task.id}
      data-task-date={task.date ?? ''}
      data-task-done={task.done ? '1' : '0'}
      className={`flex items-center gap-2.5 rounded-lg ${
        compact ? 'min-h-[34px] px-2 py-1.5' : 'min-h-[40px] px-2 py-2'
      } ${
        divided ? 'border-b border-ink-800 last:border-b-0' : ''
      } ${isDragging ? 'dnd-dragging' : 'active:bg-ink-800/60'} ${className}`}
    >
      <TaskCircle
        done={task.done}
        size={compact ? 'sm' : 'md'}
        onToggle={() => onToggle(task)}
      />
      <span
        className={`min-w-0 flex-1 truncate transition-colors duration-200 ${
          compact ? 'text-[13px] leading-5' : 'text-[14px] leading-6'
        } ${
          task.done
            ? 'text-mist-500 line-through decoration-mist-500/70'
            : 'text-mist-50'
        }`}
      >
        {task.title}
      </span>
      {accent ? (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full opacity-0 sm:opacity-60"
          style={{ backgroundColor: accent }}
        />
      ) : null}
    </div>
  )
}
