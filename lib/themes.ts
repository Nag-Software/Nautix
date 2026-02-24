import type { CSSProperties } from "react"

export function getThemeStyles(
  currentTheme?: string,
  previewDarkMode?: boolean,
): CSSProperties {
  const isDark = typeof previewDarkMode === "boolean" ? previewDarkMode : currentTheme === "dark"

  if (isDark) {
    return {
      background: "var(--background)",
      color: "var(--foreground)",
      borderColor: "rgba(255,255,255,0.06)",
    }
  }

  return {
    background: "var(--background)",
    color: "var(--foreground)",
    borderColor: "rgba(0,0,0,0.06)",
  }
}

export default getThemeStyles
