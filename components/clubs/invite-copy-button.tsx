'use client'

import { useState } from 'react'
import { CopyIcon, CheckIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export const InviteCopyButton = ({ inviteUrl }: { inviteUrl: string }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? (
        <>
          <CheckIcon size={14} />
          Copied!
        </>
      ) : (
        <>
          <CopyIcon size={14} />
          Copy Link
        </>
      )}
    </Button>
  )
}
