"use client"

import type React from "react"
import { createContext, useContext } from "react"

const SettingsContext = createContext<undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // No settings logic needed
  return <>{children}</>
}

export function useSettings() {
  // No settings to provide/use
  throw new Error("Settings have been removed and are no longer available.")
}
