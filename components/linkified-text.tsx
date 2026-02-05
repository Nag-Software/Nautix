import * as React from "react"
import Markdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LinkifiedText({
  text,
  className,
  openLabel = "Åpne",
}: {
  text: string
  className?: string
  openLabel?: string
}) {
  return (
    <div className={cn("whitespace-pre-wrap break-words", className)}>
      <Markdown
        components={{
          a: ({ href, children, ...props }) => {
            if (!href) return <span>{children}</span>
            
            return (
              <span className="inline-flex flex-col gap-2 align-baseline sm:flex-row sm:items-center sm:gap-2">
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline underline-offset-2 text-primary break-all"
                  {...props}
                >
                  {href}
                </a>
                <Button
                  asChild
                  variant="default"
                  size="sm"
                  className="h-9 px-4 text-sm w-fit sm:h-8 sm:px-3"
                >
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`${openLabel}: ${href}`}
                  >
                    {openLabel}
                  </a>
                </Button>
              </span>
            )
          },
        }}
      >
        {text}
      </Markdown>
    </div>
  )
}
