'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { SpinnerIcon } from '@phosphor-icons/react'
import { joinClub } from '@/lib/actions/club.actions'
import { Button } from '@/components/ui/button'

export const JoinButton = ({ clubId }: { clubId: string }) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleJoin = () => {
    startTransition(async () => {
      const res = await joinClub(clubId)
      if ('error' in res) return
      router.push(`/clubs/${clubId}`)
    })
  }

  return (
    <Button className="w-full" onClick={handleJoin} disabled={isPending}>
      {isPending ? (
        <>
          <SpinnerIcon className="animate-spin" />
          Joining…
        </>
      ) : (
        'Join Club'
      )}
    </Button>
  )
}
