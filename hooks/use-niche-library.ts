"use client"

import { useState, useEffect, useCallback } from "react"
import type { NicheItem } from "@/types/game"

const STORAGE_KEY = "farwane_niches_v1"
const MAX_LENGTH = 100

function genId(): string {
  return `n_${Math.random().toString(36).slice(2, 8)}`
}

function load(): NicheItem[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  } catch {
    return []
  }
}

function save(niches: NicheItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(niches))
}

export function useNicheLibrary() {
  const [niches, setNiches] = useState<NicheItem[]>([])

  // Hydrate from localStorage on mount
  useEffect(() => {
    setNiches(load())
  }, [])

  // Persist every change
  useEffect(() => {
    save(niches)
  }, [niches])

  const addNiche = useCallback((text: string): boolean => {
    const clean = text.trim().slice(0, MAX_LENGTH)
    if (!clean) return false
    // Dedup (case-insensitive)
    setNiches((prev) => {
      if (prev.some((n) => n.text.toLowerCase() === clean.toLowerCase())) return prev
      return [...prev, { id: genId(), text: clean, createdAt: Date.now() }]
    })
    return true
  }, [])

  const editNiche = useCallback((id: string, text: string) => {
    const clean = text.trim().slice(0, MAX_LENGTH)
    if (!clean) return
    setNiches((prev) => prev.map((n) => (n.id === id ? { ...n, text: clean } : n)))
  }, [])

  const deleteNiche = useCallback((id: string) => {
    setNiches((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return { niches, addNiche, editNiche, deleteNiche }
}
