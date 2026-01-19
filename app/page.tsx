"use client"

import { useEffect, useMemo, useState } from "react"
import { LayoutGroup, motion } from "framer-motion"
import { GroupCard } from "@/components/group-card"
import { SaveBar } from "@/components/save-bar"
import teamsData from "@/data/teams.json"
import { computeFlagGradient } from "@/lib/flags"

type TeamOption = {
  id: string
  name: string
  colors?: string[]
}

type TeamUI = {
  id: string
  name: string
  colors?: string[]
  is_placeholder: boolean
  placeholder_options?: TeamOption[]
}

type GroupsState = Record<string, TeamUI[]>

const STORAGE_KEY = "wc2026-bracket-draft-v5"
const NAME_KEY = "wc2026-bracket-name-v1"

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "")
}

// 0..1 stable-ish "random"
function hash01(input: string) {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 1000) / 1000
}

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [savedName, setSavedName] = useState("")
  const [groups, setGroups] = useState<GroupsState>((teamsData as any).groups as GroupsState)

  // intro timing
  const [introExiting, setIntroExiting] = useState(false)
  const [introDone, setIntroDone] = useState(false)

  // Always derive letters from teams.json (A–L)
  const groupLetters = useMemo(() => Object.keys((teamsData as any).groups ?? {}).sort(), [])

  useEffect(() => {
    setMounted(true)

    // restore saved name
    const n = localStorage.getItem(NAME_KEY)
    if (n) setSavedName(n)

    // restore saved picks (if they exist)
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === "object") {
          setGroups((prev) => {
            const merged: GroupsState = { ...(prev as any) }
            groupLetters.forEach((letter) => {
              if (Array.isArray(parsed[letter])) merged[letter] = parsed[letter]
            })
            return merged
          })
        }
      } catch {
        // ignore
      }
    }

    // Short + snappy (you wanted shorter)
    const t1 = setTimeout(() => setIntroExiting(true), 950)
    const t2 = setTimeout(() => setIntroDone(true), 1550)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [groupLetters])

  useEffect(() => {
    if (mounted) localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  }, [groups, mounted])

  const groupsUI: GroupsState = useMemo(() => {
    return Object.fromEntries(
      Object.entries(groups).map(([letter, teams]) => [
        letter,
        (teams as any[]).map((t) => ({
          id: t.id ?? t.team_id ?? slugify(t.name ?? "team"),
          name: t.name ?? "Unknown",
          colors: t.colors ?? ["#6B7280", "#9CA3AF"],
          is_placeholder: Boolean(t.is_placeholder),
          placeholder_options: t.placeholder_options?.map((o: any) => ({
            id: o.id ?? o.team_id ?? slugify(o.name ?? "option"),
            name: o.name ?? "Unknown",
            colors: o.colors ?? ["#6B7280", "#9CA3AF"],
          })),
        })),
      ]),
    )
  }, [groups])

  const completedGroups = useMemo(() => {
    return groupLetters.reduce((count, letter) => {
      const teams = groupsUI[letter] ?? []
      const complete = teams.length > 0 && teams.every((t) => !t.is_placeholder)
      return count + (complete ? 1 : 0)
    }, 0)
  }, [groupLetters, groupsUI])

  const handleTeamsReorder = (groupLetter: string, newTeams: TeamUI[]) => {
    setGroups((prev) => ({ ...prev, [groupLetter]: newTeams }))
  }

  const handleSave = (username: string) => {
    const clean = username.trim()
    if (!clean) return
    localStorage.setItem(NAME_KEY, clean)
    setSavedName(clean)
    alert(`Picks saved for ${clean}!`)
  }

  /**
   * Intro flags must use the SAME ids as the group flags (layoutId = flag-{id})
   * We build them from teamsData (not from localStorage) so the intro is stable.
   */
  const introFlags = useMemo(() => {
    const result: Array<{ id: string; name: string; colors: string[] }> = []

    groupLetters.forEach((letter) => {
      const teams = ((teamsData as any).groups?.[letter] ?? []) as any[]
      teams.forEach((t) => {
        result.push({
          id: t.id ?? t.team_id ?? slugify(t.name ?? "team"),
          name: t.name ?? "Team",
          colors: t.colors ?? ["#6B7280", "#9CA3AF"],
        })
      })
    })

    // enforce 48
    return result.slice(0, 48)
  }, [groupLetters])

  const flagsRowA = useMemo(() => introFlags.slice(0, 24), [introFlags])
  const flagsRowB = useMemo(() => introFlags.slice(24, 48), [introFlags])

  // center → out delay (2 rows x 24 cols) + tiny jitter so it feels alive
  const centerOutDelayMs = (row: number, col: number, id: string) => {
    const centerRow = 0.5
    const centerCol = 11.5
    const dist = Math.abs(row - centerRow) + Math.abs(col - centerCol)
    const jitter = hash01(id) * 70 // 0..70ms
    return Math.round(dist * 28 + jitter)
  }

  if (!mounted) return null

  return (
    <LayoutGroup>
      <div className="wc-page">
        {/* INTRO */}
        {!introDone && (
          <div className={`intro-overlay ${introExiting ? "is-exiting" : ""}`} aria-hidden="true">
            <div className="intro-inner">
              <div className={`intro-brand ${introExiting ? "is-fading" : ""}`}>
                <div className="intro-logo" aria-label="World Cup 2026">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" opacity="0.5" />
                    <circle cx="24" cy="24" r="12" fill="currentColor" opacity="0.75" />
                  </svg>
                </div>
                <div className="intro-wordmark">World Cup 2026</div>
              </div>

              <h1 className={`intro-title ${introExiting ? "is-fading" : ""}`}>The World Awaits</h1>
              <p className={`intro-subtitle ${introExiting ? "is-fading" : ""}`}>
                48 nations, one trophy, infinite stories.
              </p>

              {/* “Wave as a unit” container */}
              <div className="intro-flags intro-flags--wave">
                <div className="intro-flags-row row-a">
                  {flagsRowA.map((team, col) => {
                    const inDelay = centerOutDelayMs(0, col, `a-${team.id}`)
                    const floatPhase = Math.round(hash01(`float-${team.id}`) * 900)
                    return (
                      <motion.div
                        key={`intro-a-${team.id}`}
                        layoutId={`flag-${team.id}`}
                        className={`flag flag--wavy intro-flag-tile ${introExiting ? "intro-flag-handoff" : ""}`}
                        style={{
                          backgroundImage: computeFlagGradient(team.colors),
                          animationDelay: `${inDelay}ms, ${floatPhase}ms`,
                        }}
                        transition={{ type: "spring", stiffness: 260, damping: 28 }}
                      />
                    )
                  })}
                </div>

                <div className="intro-flags-row row-b">
                  {flagsRowB.map((team, col) => {
                    const inDelay = centerOutDelayMs(1, col, `b-${team.id}`)
                    const floatPhase = Math.round(hash01(`float-b-${team.id}`) * 900)
                    return (
                      <motion.div
                        key={`intro-b-${team.id}`}
                        layoutId={`flag-${team.id}`}
                        className={`flag flag--wavy intro-flag-tile ${introExiting ? "intro-flag-handoff" : ""}`}
                        style={{
                          backgroundImage: computeFlagGradient(team.colors),
                          animationDelay: `${inDelay}ms, ${floatPhase}ms`,
                        }}
                        transition={{ type: "spring", stiffness: 260, damping: 28 }}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MAIN PAGE (mounts once exiting starts, so morph has targets) */}
        <div className={`page-content ${introExiting || introDone ? "is-visible" : ""}`}>
          <div className="max-w-[1400px] mx-auto">
            <section className="hero">
              <div className="step-chip">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M8 1L10.5 6L16 6.75L12 10.5L13 16L8 13.25L3 16L4 10.5L0 6.75L5.5 6L8 1Z"
                    fill="currentColor"
                  />
                </svg>
                World Cup 2026 Group Stage
              </div>

              <h1 className="hero-title">Predict the Group Standings</h1>
              <p className="hero-subtitle">
                Drag teams to reorder within each group. Select playoff winners from the dropdowns.
              </p>
            </section>

            <div className="group-grid">
              {groupLetters.map((letter) => (
                <GroupCard
                  key={letter}
                  groupLetter={letter}
                  teams={groupsUI[letter] ?? []}
                  onTeamsReorder={(newTeams) => handleTeamsReorder(letter, newTeams)}
                />
              ))}
            </div>
          </div>

          <SaveBar onSave={handleSave} progress={{ done: completedGroups, total: groupLetters.length }} defaultName={savedName} />
        </div>
      </div>
    </LayoutGroup>
  )
}
