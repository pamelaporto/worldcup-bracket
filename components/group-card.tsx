"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, GripVertical } from "lucide-react"
import { motion } from "framer-motion"
import { computeFlagGradient } from "@/lib/flags"

type TeamOption = {
  id: string
  name: string
  colors: string[]
}

type Team = {
  id: string
  name: string
  colors?: string[]
  is_placeholder: boolean
  placeholder_options?: TeamOption[]
}

type GroupCardProps = {
  groupLetter: string
  teams: Team[]
  onTeamsReorder: (teams: Team[]) => void
}

type MenuPos = { top: number; left: number; width: number }

export function GroupCard({ groupLetter, teams, onTeamsReorder }: GroupCardProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Only allow one dropdown open at a time (simpler + avoids collisions)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  // Anchors per row so we can position the portal menu
  const anchorRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null)

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) return

    const newTeams = [...teams]
    const [draggedTeam] = newTeams.splice(draggedIndex, 1)
    newTeams.splice(dropIndex, 0, draggedTeam)

    onTeamsReorder(newTeams)
    setDraggedIndex(null)
  }

  const handleDragEnd = () => setDraggedIndex(null)

  const toggleDropdown = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  const selectPlayoffTeam = (teamIndex: number, selectedTeam: TeamOption) => {
    const newTeams = [...teams]
    newTeams[teamIndex] = {
      id: selectedTeam.id,
      name: selectedTeam.name,
      colors: selectedTeam.colors,
      is_placeholder: false,
      placeholder_options: undefined,
    }
    onTeamsReorder(newTeams)
    setOpenIndex(null)
  }

  // --- Portal positioning + close behaviors ---
  useEffect(() => {
    if (openIndex === null) {
      setMenuPos(null)
      return
    }

    const update = () => {
      const anchor = anchorRefs.current[openIndex]
      if (!anchor) return
      const r = anchor.getBoundingClientRect()

      setMenuPos({
        top: r.bottom + 6,
        left: r.left,
        width: r.width,
      })
    }

    update()

    // Keep it pinned during scroll (including inside scroll containers)
    window.addEventListener("scroll", update, true)
    window.addEventListener("resize", update)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null)
    }

    const onPointerDown = (e: PointerEvent) => {
      const anchor = anchorRefs.current[openIndex]
      if (!anchor) return

      const menuEl = document.getElementById(`wc-menu-${groupLetter}-${openIndex}`)
      const target = e.target as Node

      // Click outside anchor + outside menu closes it
      if (menuEl && menuEl.contains(target)) return
      if (anchor.contains(target)) return
      setOpenIndex(null)
    }

    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("pointerdown", onPointerDown)

    return () => {
      window.removeEventListener("scroll", update, true)
      window.removeEventListener("resize", update)
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("pointerdown", onPointerDown)
    }
  }, [openIndex, groupLetter])

  return (
    <div className={`group-card ${draggedIndex !== null ? "is-dragging" : ""}`}>
      <div className="group-tab">{groupLetter}</div>

      <div className="group-card__inner">
        <div className="group-label">Group {groupLetter}</div>

        {teams.map((team, index) => {
          const isOpen = openIndex === index

          return (
            <div
              key={`${groupLetter}-${team.id}-${index}`}
              className={`team-row ${draggedIndex === index ? "dragging" : ""}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="drag-handle" aria-hidden="true">
                <GripVertical className="drag-icon" />
              </div>

              <div className="pos-pill">
                {groupLetter}
                {index + 1}
              </div>

              {/* Morph target */}
              <motion.div
                className="flag flag--morph"
                layoutId={`flag-${team.id}`}
                data-flag-id={team.id}
                style={{ backgroundImage: computeFlagGradient(team.colors) }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
              />

              {team.is_placeholder ? (
                <div
                  className="dropdown-anchor"
                  ref={(el) => {
                    anchorRefs.current[index] = el
                  }}
                >
                  <button
                    type="button"
                    className="select-btn"
                    onClick={() => toggleDropdown(index)}
                    aria-expanded={isOpen}
                  >
                    <div className="select-wrap">
                      <div className="select-meta">
                        <div className="select-value select-value--placeholder">Pick playoff winner</div>
                      </div>
                      <ChevronDown className="chev" />
                    </div>
                  </button>

                  {/* Menu is rendered in a Portal (not clipped by the card) */}
                  {isOpen && menuPos
                    ? createPortal(
                        <div
                          id={`wc-menu-${groupLetter}-${index}`}
                          className="menu"
                          role="listbox"
                          style={{
                            position: "fixed",
                            top: menuPos.top,
                            left: menuPos.left,
                            width: menuPos.width,
                            zIndex: 9999,
                          }}
                        >
                          {team.placeholder_options?.map((option) => (
                            <div
                              key={option.id}
                              className="menu-item"
                              role="option"
                              onClick={() => selectPlayoffTeam(index, option)}
                            >
                              <motion.div
                                className="menu-flag"
                                layoutId={`flag-${option.id}`}
                                style={{ backgroundImage: computeFlagGradient(option.colors) }}
                              />
                              <span className="menu-name">{option.name}</span>
                            </div>
                          ))}
                        </div>,
                        document.body
                      )
                    : null}
                </div>
              ) : (
                <span className="team-name">{team.name}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
