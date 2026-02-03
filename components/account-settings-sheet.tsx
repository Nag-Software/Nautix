"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Trash2, Mail, User, KeyRound, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AccountSettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    name: string
    email: string
  }
}

export function AccountSettingsSheet({
  open,
  onOpenChange,
  user,
}: AccountSettingsSheetProps) {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [isUpdating, setIsUpdating] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const handleUpdateProfile = async () => {
    setIsUpdating(true)
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) throw new Error("Ikke logget inn")

      // Update user metadata (name)
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { full_name: name },
      })

      if (metadataError) throw metadataError

      // Update email if changed
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email,
        })

        if (emailError) throw emailError
        toast.success("Bekreftelseslenke sendt til ny e-post")
      } else {
        toast.success("Profil oppdatert")
      }

      // Refresh the page to update UI
      setTimeout(() => router.refresh(), 1000)
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast.error(error.message || "Kunne ikke oppdatere profil")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleResetPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
      toast.success("Tilbakestillingslenke sendt til e-post")
    } catch (error: any) {
      console.error("Error resetting password:", error)
      toast.error(error.message || "Kunne ikke sende tilbakestillingslenke")
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== "slett min konto") {
      toast.error("Skriv 'slett min konto' for å bekrefte")
      return
    }

    setIsDeleting(true)
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) throw new Error("Ikke logget inn")

      // Delete all user data through Supabase CASCADE
      // The RLS policies and foreign keys will handle cascading deletes
      
      // Sign out and delete auth user
      const { error } = await supabase.auth.admin.deleteUser(currentUser.id)
      
      if (error) {
        // If admin API is not available, just sign out
        console.warn("Admin delete not available, signing out:", error)
        await supabase.auth.signOut()
        toast.success("Brukeren er logget ut. Kontakt support for fullstendig sletting.")
      } else {
        toast.success("Kontoen er slettet")
      }

      router.push("/login")
    } catch (error: any) {
      console.error("Error deleting account:", error)
      toast.error(error.message || "Kunne ikke slette konto")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Kontoinnstillinger</SheetTitle>
            <SheetDescription>
              Administrer din profil og kontoinnstillinger
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6 px-6">
            {/* Profile Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4" />
                <span>Profilinformasjon</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Navn</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ditt navn"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">E-post</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="din@epost.no"
                  />
                  <p className="text-xs text-muted-foreground">
                    Du vil motta en bekreftelseslenke hvis du endrer e-post
                  </p>
                </div>

                <Button
                  onClick={handleUpdateProfile}
                  disabled={isUpdating || (name === user.name && email === user.email)}
                  className="w-full"
                >
                  {isUpdating ? "Oppdaterer..." : "Oppdater profil"}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Password Reset */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <KeyRound className="h-4 w-4" />
                <span>Sikkerhet</span>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Tilbakestill passordet ditt via e-post
                </p>
                <Button
                  onClick={handleResetPassword}
                  variant="outline"
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send tilbakestillingslenke
                </Button>
              </div>
            </div>

            <Separator />

            {/* Delete Account */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>Faresone</span>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Når du sletter kontoen din, vil all data bli permanent fjernet. Dette kan ikke angres.
                </p>
                <Button
                  onClick={() => setDeleteDialogOpen(true)}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Slett konto
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Er du helt sikker?</DialogTitle>
            <DialogDescription>
              Dette vil permanent slette kontoen din og alle tilknyttede data. 
              Denne handlingen kan ikke angres.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm font-medium text-destructive">
                Følgende data vil bli slettet:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Båtinformasjon</li>
                <li>• Motor- og utstyrsdata</li>
                <li>• Dokumenter og vedlegg</li>
                <li>• Vedlikeholdslogg og påminnelser</li>
                <li>• Samtalehistorikk</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                Skriv <span className="font-semibold">"slett min konto"</span> for å bekrefte
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="slett min konto"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeleteConfirmText("")
              }}
            >
              Avbryt
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmText.toLowerCase() !== "slett min konto"}
            >
              {isDeleting ? "Sletter..." : "Slett konto permanent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
