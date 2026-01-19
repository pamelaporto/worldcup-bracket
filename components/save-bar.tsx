"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type SaveBarProps = {
  onSave: (name: string) => void
}

export function SaveBar({ onSave }: SaveBarProps) {
  const [name, setName] = useState("")
  const [isSaved, setIsSaved] = useState(false)

  const completedGroups = 1 // <- if you already compute this in page.tsx, pass it in as a prop instead
  const totalGroups = 8

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave(trimmed)
    setIsSaved(true)
    window.setTimeout(() => setIsSaved(false), 1500)
  }

  return (
    <div className="savebar-shell">
      <div className="savebar my-0 mb-0 mt-[0]">
        <div className="savebar-left">
          <span className="savebar-dot" aria-hidden="true" />
          <span className="savebar-text">
            <strong>{completedGroups}</strong> of {totalGroups} groups predicted
          </span>
        </div>

        <div className="savebar-right">
          <Input
            type="text"
            placeholder="Enter your name to save"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="savebar-input"
          />

          <Button onClick={handleSave} disabled={!name.trim() || isSaved} className="savebar-btn">
            {isSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
