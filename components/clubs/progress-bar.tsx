import { cn } from '@/lib/utils'

type Props = {
  percent: number
  finished?: boolean
  className?: string
}

/** Thin horizontal bar; a finished phase is drawn in the accent colour. */
export const ProgressBar = ({ percent, finished = false, className }: Props) => {
  const width = Math.max(0, Math.min(100, percent))
  return (
    <div
      className={cn('h-1.5 w-full bg-muted overflow-hidden', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={width}
    >
      <div
        className={cn('h-full transition-all', finished ? 'bg-primary' : 'bg-foreground/60')}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
