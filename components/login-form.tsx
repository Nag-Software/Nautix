"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
      } else {
        // successful login — redirect to conversations
        router.push("/samtaler")
      }
    } catch (err: any) {
      setError(err?.message ?? "Ukjent feil")
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuth(provider: string) {
    setError(null)
    setLoading(true)
    try {
      await supabase.auth.signInWithOAuth({ provider: provider as any })
    } catch (err: any) {
      setError(err?.message ?? "OAuth-feil")
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Velkommen tilbake</CardTitle>
          <CardDescription>
            Logg inn med Apple eller Google konto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <FieldGroup>
              <Field>
                <Button variant="outline" type="button" onClick={() => handleOAuth("apple")}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                      fill="currentColor"
                    />
                  </svg>
                  Logg inn med Apple
                </Button>
                <Button variant="outline" type="button" onClick={() => handleOAuth("google")}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Logg inn med Google
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Eller fortsett med
              </FieldSeparator>
              <div className="space-y-4">
              <Field className="gap-2">
                <FieldLabel htmlFor="email">Epost</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="ola@nordmann.no"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field className="gap-2">
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Passord</FieldLabel>
                  <a
                    href="/reset-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Glemt passord?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                
              </Field>
              </div>
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? "Logger inn…" : "Logg inn"}
                </Button>
                <FieldDescription className="text-center">
                  Har du ikke en konto? <a href="/signup">Registrer deg</a>
                </FieldDescription>
              </Field>
              {error ? (
                <Field>
                  <FieldDescription className="text-center text-destructive" aria-live="polite">
                    {error}
                  </FieldDescription>
                </Field>
              ) : null}
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Ved å klikke på "Logg inn", godkjenner du våre <a href="/terms">Vilkår for bruk</a>{" "}
        og <a href="/privacy">Personvernerklæring</a>.
      </FieldDescription>
    </div>
  )
}
