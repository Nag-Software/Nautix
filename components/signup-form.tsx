"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passordene stemmer ikke overens")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Passordet må være minst 6 tegn")
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      })

      if (error) throw error

      setSuccess(true)
      setError("Konto opprettet! Sjekk e-posten din for å bekrefte kontoen.")
    } catch (err: any) {
      setError(err.message || "Kunne ikke opprette konto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSignUp}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Opprett konto</h1>
                <p className="text-muted-foreground text-balance">
                  Registrer deg for å komme i gang med Nautix
                </p>
              </div>
              
              {error && (
                <div className={`rounded-lg p-3 text-sm ${
                  success
                    ? "bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-100"
                    : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-100"
                }`}>
                  {error}
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="email">E-post</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="din@epost.no"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={success}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Passord</FieldLabel>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Minst 6 tegn"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={success}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirmPassword">Bekreft passord</FieldLabel>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="Skriv inn passordet på nytt"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={success}
                />
              </Field>
              <Field>
                <Button type="submit" disabled={loading || success} className="w-full">
                  {loading ? "Oppretter konto..." : success ? "Konto opprettet!" : "Opprett konto"}
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Har du allerede en konto?{" "}
                <Link href="/login" className="underline underline-offset-2 hover:text-primary">
                  Logg inn
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholder.svg"
              alt="Nautix - Båtadministrasjon"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Ved å opprette en konto godtar du våre <a href="#" className="underline underline-offset-2">Vilkår for bruk</a>{" "}
        og <a href="#" className="underline underline-offset-2">Personvernregler</a>.
      </FieldDescription>
    </div>
  )
}
