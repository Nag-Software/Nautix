"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Toaster, toast } from "sonner"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error("Passord må være minst 8 tegn")
      return
    }
    if (password !== confirm) {
      toast.error("Passordene er ikke like")
      return
    }
    try {
      setLoading(true)
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success("Passord oppdatert. Logger inn...")
      setTimeout(() => {
        router.push("/login")
        router.refresh()
      }, 1200)
    } catch (err: any) {
      toast.error(err.message || "Kunne ikke oppdatere passord")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-md">
        <Card className="overflow-hidden p-0">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={submit} className="grid gap-4">
              <h1 className="text-2xl font-bold text-center">Velg nytt passord</h1>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="password">Nytt passord</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minst 8 tegn"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirm">Bekreft passord</FieldLabel>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </Field>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Oppdaterer..." : "Oppdater passord"}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  )
}
