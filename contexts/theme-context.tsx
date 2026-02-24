"use client"

import { useTheme as useNextTheme } from "next-themes"

export function useTheme() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme()

  const currentTheme = resolvedTheme ?? theme ?? systemTheme ?? "light"
  const previewDarkMode = currentTheme === "dark"

  return { theme, setTheme, resolvedTheme, systemTheme, currentTheme, previewDarkMode }
}

export default useTheme
