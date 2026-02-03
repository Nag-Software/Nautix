import * as React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Part =
  | { type: "text"; value: string }
  | { type: "url"; value: string; trailing: string }

const URL_REGEX = /https?:\/\/[^\s<>()]+/g

function isProbablyValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function splitTextWithUrls(text: string): Part[] {
  const input = text || ""
  if (!input) return [{ type: "text", value: "" }]

  const parts: Part[] = []
  let lastIndex = 0

  for (const match of input.matchAll(URL_REGEX)) {
    const index = match.index ?? 0
    const raw = match[0] ?? ""

    if (index > lastIndex) {
      parts.push({ type: "text", value: input.slice(lastIndex, index) })
    }

    let url = raw
    let trailing = ""

    // Keep common trailing punctuation as plain text, not part of the link.
    while (url && /[\]\)\}"'.,!?;:]+$/.test(url)) {
      trailing = url.slice(-1) + trailing
      url = url.slice(0, -1)
    }

    if (url && isProbablyValidHttpUrl(url)) {
      parts.push({ type: "url", value: url, trailing })
    } else {
      // Fallback: treat as plain text if it doesn't parse as a URL.
      parts.push({ type: "text", value: raw })
    }

    lastIndex = index + raw.length
  }

  if (lastIndex < input.length) {
    parts.push({ type: "text", value: input.slice(lastIndex) })
  }

  // Ensure we always return at least one part.
  return parts.length ? parts : [{ type: "text", value: input }]
}

export function LinkifiedText({
  text,
  className,
  openLabel = "Åpne",
}: {
  text: string
  className?: string
  openLabel?: string
}) {
  const parts = splitTextWithUrls(text)

  return (
    <span className={cn("whitespace-pre-wrap break-words", className)}>
      {parts.map((part, i) => {
        if (part.type === "text") {
          return <React.Fragment key={i}>{part.value}</React.Fragment>
        }

        return (
          <React.Fragment key={i}>
            <span className="inline-flex flex-col gap-2 align-baseline sm:flex-row sm:items-center sm:gap-2">
              <a
                href={part.value}
                target="_blank"
                rel="noreferrer noopener"
                className="underline underline-offset-2 text-primary break-all"
              >
                {part.value}
              </a>
              <Button
                asChild
                variant="default"
                size="sm"
                className="h-9 px-4 text-sm w-fit sm:h-8 sm:px-3"
              >
                <a
                  href={part.value}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`${openLabel}: ${part.value}`}
                >
                  {openLabel}
                </a>
              </Button>
            </span>
            {part.trailing ? part.trailing : null}
          </React.Fragment>
        )
      })}
    </span>
  )
}
