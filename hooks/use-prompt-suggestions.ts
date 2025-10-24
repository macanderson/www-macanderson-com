"use client"

import { useEffect, useState } from "react"

const STORAGE_KEY = "mac-resume-prompt-history"
const TIMESTAMP_KEY = "mac-resume-last-visit"
const MAX_HISTORY = 10
const EXPIRY_HOURS = 24

export function usePromptHistory() {
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    const lastVisit = localStorage.getItem(TIMESTAMP_KEY)
    const now = Date.now()

    if (lastVisit) {
      const hoursSinceLastVisit = (now - Number.parseInt(lastVisit)) / (1000 * 60 * 60)
      if (hoursSinceLastVisit >= EXPIRY_HOURS) {
        // Purge old data
        localStorage.removeItem(STORAGE_KEY)
        localStorage.setItem(TIMESTAMP_KEY, now.toString())
        return
      }
    } else {
      // First visit
      localStorage.setItem(TIMESTAMP_KEY, now.toString())
    }

    // Load history from localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setHistory(JSON.parse(stored))
      } catch (e) {
        console.error("[v0] Failed to parse prompt history", e)
      }
    }
  }, [])

  const addPrompt = (prompt: string) => {
    setHistory((prev) => {
      const newHistory = [prompt, ...prev].slice(0, MAX_HISTORY)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))
      localStorage.setItem(TIMESTAMP_KEY, Date.now().toString())
      return newHistory
    })
  }

  return { history, addPrompt }
}

export function usePromptSuggestions(history: string[], hasMessages: boolean) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (hasMessages) {
      setSuggestions([])
      return
    }

    // Generate suggestions when history changes
    if (history.length === 0) {
      // Default suggestions when no history
      setSuggestions([
        "Tell me about your work experience",
        "What's your educational background?",
        "What are your personal interests?",
        "Show me your career timeline",
      ])
      return
    }

    const timeoutId = setTimeout(() => {
      const generateSuggestions = async () => {
        setIsLoading(true)
        try {
          const response = await fetch("/api/suggestions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ history: history.slice(0, 10) }),
          })

          if (response.ok) {
            const data = await response.json()
            setSuggestions(data.suggestions)
          } else {
            setSuggestions([
              "Tell me more about your work",
              "What about your education?",
              "Show me your interests",
              "How can I connect with you?",
            ])
          }
        } catch (error) {
          console.error("[v0] Failed to generate suggestions", error)
          // Fallback to default suggestions
          setSuggestions([
            "Tell me more about your work",
            "What about your education?",
            "Show me your interests",
            "How can I connect with you?",
          ])
        } finally {
          setIsLoading(false)
        }
      }

      generateSuggestions()
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [history, hasMessages])

  return { suggestions, isLoading }
}
