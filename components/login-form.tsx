"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push("/")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Kunne ikke logge inn")
    } finally {
      setLoading(false)
    }
  }
  
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Skriv inn e-postadressen din")
      return
    }
    try {
      setSendingReset(true)
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })
      if (error) throw error
      toast.success("Hvis e-posten finnes, er lenke sendt")
      setForgotOpen(false)
    } catch (err: any) {
      toast.error(err.message || "Kunne ikke sende e-post for tilbakestilling")
    } finally {
      setSendingReset(false)
    }
  }
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleLogin}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Velkommen tilbake</h1>
                <p className="text-muted-foreground text-balance">
                  Logg inn på din Nautix-konto
                </p>
              </div>
              
              {error && (
                <div className="rounded-lg p-3 text-sm bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-100">
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
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Passord</FieldLabel>
                  <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="ml-auto text-sm underline-offset-2 hover:underline"
                      >
                        Glemt passord?
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Tilbakestill passord</DialogTitle>
                        <DialogDescription>
                          Vi sender deg en e-post med lenke for å velge nytt passord.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handlePasswordReset} className="grid gap-4">
                        <Field>
                          <FieldLabel htmlFor="reset-email">E-post</FieldLabel>
                          <Input
                            id="reset-email"
                            type="email"
                            placeholder="din@epost.no"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </Field>
                        <DialogFooter>
                          <Button
                            type="submit"
                            disabled={sendingReset}
                            className="w-full"
                          >
                            {sendingReset ? "Sender..." : "Send tilbakestillingslenke"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </Field>
              <Field>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Logger inn..." : "Logg inn"}
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Eller
              </FieldSeparator>
              <Field>
                <Link href="/signup" className="w-full">
                  <Button 
                    variant="outline" 
                    type="button" 
                    className="w-full"
                  >
                    Opprett ny konto
                  </Button>
                </Link>
              </Field>
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/login-image.jpg"
              alt="Nautix - Båtadministrasjon"
              className="absolute opacity-90 inset-0 h-full w-full object-cover dark:brightness-90"
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Ved å fortsette godtar du våre <a href="#">Vilkår for bruk</a>{" "}
        og <a href="#">Personvernregler</a>.
      </FieldDescription>
    </div>
  )
}
