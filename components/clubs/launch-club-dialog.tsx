'use client'

import { useState, useTransition } from 'react'
import { RocketLaunchIcon, SpinnerIcon, CalendarBlankIcon } from '@phosphor-icons/react'
import { launchClub } from '@/lib/actions/club.actions'
import { launchClubSchema } from '@/lib/validations'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ClubForLaunch = {
  id: string
  readingPhases: Array<{
    id: string
    weekIndex: number
    startUnit: number
    endUnit: number
  }>
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)

const addWeeks = (date: Date, weeks: number): Date => {
  const d = new Date(date)
  d.setDate(d.getDate() + weeks * 7)
  return d
}

export const LaunchClubDialog = ({ club }: { club: ClubForLaunch }) => {
  const [open, setOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const today = new Date(new Date().setHours(0, 0, 0, 0))

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setStartDate(undefined)
      setServerError(null)
    }
    setOpen(next)
  }

  const handleLaunch = () => {
    if (!startDate) return

    const validation = launchClubSchema.safeParse({ clubId: club.id, startDate })
    if (!validation.success) {
      setServerError(validation.error.issues[0]?.message ?? 'Invalid input')
      return
    }

    setServerError(null)
    startTransition(async () => {
      const res = await launchClub({ clubId: club.id, startDate })
      if ('error' in res) {
        setServerError(res.error)
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <RocketLaunchIcon size={14} />
          Launch Club
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-base font-semibold">Launch Club</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* Start date picker */}
          <div className="flex flex-col gap-1.5">
            <p className="font-mono text-xs text-muted-foreground tracking-[0.15em] uppercase">
              Start Date
            </p>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                  disabled={isPending}
                >
                  <CalendarBlankIcon size={14} className="shrink-0" />
                  {startDate ? formatDate(startDate) : 'Pick a start date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date)
                    setCalendarOpen(false)
                  }}
                  disabled={(d) => d < today}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">Phase 1 unlocks on this date. Each subsequent phase unlocks 7 days later.</p>
          </div>

          {/* Unlock date preview */}
          {startDate && (
            <div className="flex flex-col gap-1.5">
              <p className="font-mono text-xs text-muted-foreground tracking-[0.15em] uppercase">
                Schedule Preview
              </p>
              <div className="border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-3 py-2 text-left font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Phase</th>
                      <th className="px-3 py-2 text-left font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Pages</th>
                      <th className="px-3 py-2 text-left font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Unlocks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {club.readingPhases.map((phase) => (
                      <tr key={phase.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 text-muted-foreground">Phase {phase.weekIndex + 1}</td>
                        <td className="px-3 py-2">{phase.startUnit}–{phase.endUnit}</td>
                        <td className="px-3 py-2 font-mono">{formatDate(addWeeks(startDate, phase.weekIndex))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {serverError && (
            <p className="text-xs text-destructive border border-destructive/20 bg-destructive/5 px-3 py-2">
              {serverError}
            </p>
          )}
        </div>

        <DialogFooter showCloseButton>
          <Button
            size="sm"
            onClick={handleLaunch}
            disabled={!startDate || isPending}
          >
            {isPending ? (
              <>
                <SpinnerIcon className="animate-spin" />
                Launching…
              </>
            ) : (
              <>
                <RocketLaunchIcon size={14} />
                Launch Club
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
