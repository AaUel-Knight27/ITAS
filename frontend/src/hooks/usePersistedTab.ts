import { useEffect, useState } from 'react'

export function usePersistedTab(
  storageKey: string,
  defaultTab: string,
  validTabs: string[]
): [string, (tab: string) => void] {
  const [activeTab, setActiveTab] =
    useState(defaultTab)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        storageKey
      )
      if (saved && validTabs.includes(saved)) {
        setActiveTab(saved)
      }
    } catch {
      // Ignore localStorage errors in non-browser contexts.
    }
  }, [storageKey, validTabs])

  const setAndSaveTab = (tab: string) => {
    setActiveTab(tab)
    try {
      localStorage.setItem(storageKey, tab)
    } catch {
      // Ignore localStorage write failures.
    }
  }

  return [activeTab, setAndSaveTab]
}
