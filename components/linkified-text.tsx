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
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      <Markdown
        components={{
          a: ({ href, children, ...props }) => {
            if (!href) return <span>{children}</span>
            
            // Check if it's a URL link (not just a reference)
            const isUrl = href.startsWith('http://') || href.startsWith('https://')
            
            return (
              <span className="inline-flex flex-col gap-2 align-baseline sm:flex-row sm:items-center sm:gap-2">
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline underline-offset-2 text-primary break-all hover:text-primary/80 transition-colors"
                  {...props}
                >
                  {isUrl ? href : children}
                </a>
                {isUrl && (
                  <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="h-9 px-4 text-sm w-fit sm:h-8 sm:px-3 shrink-0"
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
                )}
              </span>
            )
          },
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold mb-2 mt-3 first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-3 first:mt-0">{children}</h3>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>,
          pre: ({ children }) => <pre className="bg-muted p-3 rounded-lg overflow-x-auto mb-3">{children}</pre>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-muted-foreground/20 pl-4 italic my-3">{children}</blockquote>
          ),
          hr: () => <hr className="my-4 border-border" />,
        }}
      >
        {text}
      </Markdown>
    </div>
  )
}
