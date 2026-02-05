"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { 
  FileText, 
  Plus, 
  Upload, 
  Download,
  ExternalLink,
  Shield,
  FileCheck,
  AlertCircle,
  Loader2,
  Trash2,
  Eye,
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { LinkifiedText } from "@/components/linkified-text"

interface Document {
  id: string
  boat_id: string
  user_id: string
  name: string
  type: string
  file_path: string
  file_size: number
  upload_date: string
  expiry_date?: string
  status: "valid" | "expiring-soon" | "expired"
  created_at: string
  updated_at: string
}

interface DocumentLink {
  id: string
  boat_id: string | null
  user_id: string
  title: string
  url: string
  type: string
  description?: string | null
  source?: string | null
  created_at: string
  updated_at: string
}

export default function DokumenterPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [documentLinks, setDocumentLinks] = useState<DocumentLink[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null)
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(true)
  const [imageProgress, setImageProgress] = useState(0)
  const [formData, setFormData] = useState({
    name: "",
    type: "annet",
    expiry_date: undefined as Date | undefined,
  })
  const supabase = createClient()

  const fetchDocuments = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [docsResult, linksResult] = await Promise.all([
        supabase
          .from("documents")
          .select("*")
          .eq("user_id", user.id)
          .order("upload_date", { ascending: false }),
        supabase
          .from("document_links")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ])

      if (docsResult.error) throw docsResult.error

      // Update status based on expiry date
      const updatedDocs = (docsResult.data || []).map((doc: any) => {
        if (!doc.expiry_date) return { ...doc, status: "valid" }
        
        const expiryDate = new Date(doc.expiry_date)
        const today = new Date()
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysUntilExpiry < 0) return { ...doc, status: "expired" }
        if (daysUntilExpiry <= 30) return { ...doc, status: "expiring-soon" }
        return { ...doc, status: "valid" }
      })

      setDocuments(updatedDocs)

      if (linksResult.error) {
        const maybeMissingTable =
          linksResult.error.code === "42P01" ||
          String(linksResult.error.message || "").toLowerCase().includes("document_links")
        if (!maybeMissingTable) {
          console.error("Error fetching document links:", linksResult.error)
        }
        setDocumentLinks([])
      } else {
        setDocumentLinks((linksResult.data || []) as DocumentLink[])
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
      toast.error("Kunne ikke laste dokumenter")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!formData.name) {
        setFormData(prev => ({ ...prev, name: file.name }))
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file)
      if (!formData.name) {
        setFormData(prev => ({ ...prev, name: file.name }))
      }
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      toast.error("Velg en fil først")
      return
    }

    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Du må være logget inn")
        return
      }

      // Get or create boat
      let { data: boats } = await supabase
        .from("boats")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)

      let boatId: string

      if (!boats || boats.length === 0) {
        const { data: newBoat, error: boatError } = await supabase
          .from("boats")
          .insert([{ user_id: user.id }])
          .select("id")
          .single()

        if (boatError) throw boatError
        boatId = newBoat.id
      } else {
        boatId = boats[0].id
      }

      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split(".").pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, selectedFile)

      if (uploadError) throw uploadError

      // Save document metadata to database
      const { error: dbError } = await supabase
        .from("documents")
        .insert([{
          boat_id: boatId,
          user_id: user.id,
          name: formData.name,
          type: formData.type,
          file_path: fileName,
          file_size: selectedFile.size,
          expiry_date: formData.expiry_date ? formData.expiry_date.toISOString() : null,
          status: "valid",
        }])

      if (dbError) throw dbError

      toast.success("Dokument lastet opp")
      setUploadDialogOpen(false)
      setSelectedFile(null)
      setFormData({ name: "", type: "annet", expiry_date: undefined })
      fetchDocuments()
    } catch (error) {
      console.error("Error uploading document:", error)
      toast.error("Kunne ikke laste opp dokument")
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(doc.file_path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = doc.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Dokument lastet ned")
    } catch (error) {
      console.error("Error downloading document:", error)
      toast.error("Kunne ikke laste ned dokument")
    }
  }

  const handleView = async (doc: Document) => {
    try {
      setImageLoading(true)
      setImageProgress(0)
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.file_path, 3600) // 1 hour expiry

      if (error) throw error

      setDocumentUrl(data.signedUrl)
      setViewingDocument(doc)
      setViewDialogOpen(true)
    } catch (error) {
      console.error("Error viewing document:", error)
      toast.error("Kunne ikke åpne dokument")
    }
  }

  const handleDelete = async (doc: Document) => {
    toast(`Er du sikker på at du vil slette "${doc.name}"?`, {
      action: {
        label: "Slett",
        onClick: async () => {
          try {
            // Delete from storage
            const { error: storageError } = await supabase.storage
              .from("documents")
              .remove([doc.file_path])

            if (storageError) throw storageError

            // Delete from database
            const { error: dbError } = await supabase
              .from("documents")
              .delete()
              .eq("id", doc.id)

            if (dbError) throw dbError

            toast.success("Dokument slettet")
            fetchDocuments()
          } catch (error) {
            console.error("Error deleting document:", error)
            toast.error("Kunne ikke slette dokument")
          }
        },
      },
      cancel: {
        label: "Avbryt",
        onClick: () => {},
      },
    })
  }

  const handleDeleteLink = async (link: DocumentLink) => {
    toast(`Fjern lenken "${link.title}"?`, {
      action: {
        label: "Fjern",
        onClick: async () => {
          try {
            const { error } = await supabase
              .from("document_links")
              .delete()
              .eq("id", link.id)

            if (error) throw error
            toast.success("Lenke fjernet")
            fetchDocuments()
          } catch (error) {
            console.error("Error deleting document link:", error)
            toast.error("Kunne ikke fjerne lenken")
          }
        },
      },
      cancel: {
        label: "Avbryt",
        onClick: () => {},
      },
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid":
        return (
          <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
            <FileCheck className="h-3 w-3" />
            Gyldig
          </Badge>
        )
      case "expiring-soon":
        return (
          <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            <AlertCircle className="h-3 w-3" />
            Utløper snart
          </Badge>
        )
      case "expired":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Utløpt
          </Badge>
        )
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Forsikring":
        return Shield
      case "Sertifikat":
        return FileCheck
      default:
        return FileText
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Min båt
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dokumenter</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="flex flex-1 flex-col overflow-auto px-4 py-4 sm:px-6 md:py-6">
          <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2 sm:p-3">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dokumenter</h1>
                  <p className="text-sm text-muted-foreground">
                    Båtpapirer, forsikring og sertifikater
                  </p>
                </div>
              </div>
              <Button onClick={() => setUploadDialogOpen(true)} className="w-full sm:w-auto">
                <Upload className="mr-2 h-4 w-4" />
                Last opp dokument
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-3 sm:gap-4 grid-cols-3">
              <div className="rounded-lg border p-3 sm:p-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="inline">Totalt</span>
                </div>
                <div className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold">{documents.length}</div>
              </div>
              <div className="rounded-lg border p-3 sm:p-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <FileCheck className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  <span className="inline">Gyldige</span>
                </div>
                <div className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-green-600">
                  {documents.filter(d => d.status === "valid").length}
                </div>
              </div>
              <div className="rounded-lg border p-3 sm:p-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
                  <span className="inline">Utløper</span>
                </div>
                <div className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-yellow-600">
                  {documents.filter(d => d.status === "expiring-soon").length}
                </div>
              </div>
            </div>

            {/* External Links */}
            {!loading && documentLinks.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-base sm:text-lg font-semibold">Lenker</h2>
                <div className="space-y-2">
                  {documentLinks.map((link) => (
                    <div key={link.id} className="rounded-lg border p-2 sm:p-3">
                      <div className="flex items-start gap-2">
                        <div className="rounded-full bg-primary/10 p-1.5 shrink-0">
                          <ExternalLink className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-sm leading-tight">{link.title}</h3>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteLink(link)}
                              className="h-7 px-2 text-xs"
                            >
                              <Trash2 className="h-3 w-3 sm:mr-1" />
                              <span className="hidden sm:inline">Fjern</span>
                            </Button>
                          </div>
                          {link.description ? (
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                              {link.description}
                            </p>
                          ) : null}
                          <div className="text-xs text-muted-foreground">
                            {link.type ? <span>{link.type}</span> : null}
                            <span className="mx-2">•</span>
                            <span>{new Date(link.created_at).toLocaleDateString("nb-NO")}</span>
                          </div>
                          <div className="pt-1">
                            <LinkifiedText text={link.url} className="text-sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : documents.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed p-8 sm:p-12 text-center">
                <div className="mx-auto rounded-full bg-muted p-3 sm:p-4 w-fit">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-base sm:text-lg font-semibold">Ingen dokumenter ennå</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Last opp ditt første dokument for å komme i gang
                </p>
                <Button onClick={() => setUploadDialogOpen(true)} className="mt-4">
                  <Upload className="mr-2 h-4 w-4" />
                  Last opp dokument
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <h2 className="text-base sm:text-lg font-semibold">Dokumentarkiv</h2>
                {documents.map((doc) => {
                  const Icon = getTypeIcon(doc.type)
                  return (
                    <div key={doc.id} className="rounded-lg border p-2 sm:p-3">
                      <div className="flex items-start gap-2">
                        <div className="rounded-full bg-primary/10 p-1.5 shrink-0">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-sm leading-tight">{doc.name}</h3>
                            {getStatusBadge(doc.status)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {doc.type}
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            <span>
                              {new Date(doc.upload_date).toLocaleDateString('nb-NO')}
                            </span>
                            {doc.expiry_date && (
                              <span>
                                Utløper: {new Date(doc.expiry_date).toLocaleDateString('nb-NO')}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1.5 pt-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleView(doc)}
                              className="h-7 px-2 text-xs"
                            >
                              <Eye className="h-3 w-3 sm:mr-1" />
                              <span className="inline">Vis</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownload(doc)}
                              className="h-7 px-2 text-xs"
                            >
                              <Download className="h-3 w-3 sm:mr-1" />
                              <span className="inline">Last ned</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDelete(doc)}
                              className="h-7 px-2 text-xs"
                            >
                              <Trash2 className="h-3 w-3 sm:mr-1" />
                              <span className="hidden sm:inline">Slett</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Last opp dokument</DialogTitle>
              <DialogDescription>
                Last opp båtpapirer, forsikring eller andre viktige dokumenter
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              {/* Drag and drop area */}
              <div
                className={`rounded-lg border-2 border-dashed p-6 sm:p-8 text-center transition-colors ${
                  isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="mx-auto rounded-full bg-muted p-3 w-fit">
                  <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                </div>
                <div className="mt-3">
                  <h3 className="font-semibold text-sm sm:text-base">Dra og slipp dokumenter her</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    eller klikk for å velge fil
                  </p>
                </div>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Velg fil
                </Button>
                {selectedFile && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Valgt: {selectedFile.name}
                  </p>
                )}
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Dokumentnavn *</Label>
                  <Input
                    id="name"
                    placeholder="F.eks. Båtforsikring 2026"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="forsikring">Forsikring</SelectItem>
                      <SelectItem value="registrering">Registrering</SelectItem>
                      <SelectItem value="kontrakt">Kontrakt</SelectItem>
                      <SelectItem value="sertifikat">Sertifikat</SelectItem>
                      <SelectItem value="garanti">Garanti</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="kvittering">Kvittering</SelectItem>
                      <SelectItem value="annet">Annet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Utløpsdato (valgfritt)</Label>
                  <DatePicker
                    value={formData.expiry_date}
                    onChange={(date) => setFormData({ ...formData, expiry_date: date })}
                    placeholder="Velg utløpsdato"
                  />
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUploadDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Avbryt
                </Button>
                <Button type="submit" disabled={uploading || !selectedFile} className="w-full sm:w-auto">
                  {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Last opp
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Document Viewer Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-5xl h-auto">
            <DialogHeader>
              <DialogTitle>{viewingDocument?.name}</DialogTitle>
              <DialogDescription>
                {viewingDocument?.type} - Lastet opp {viewingDocument?.upload_date && new Date(viewingDocument.upload_date).toLocaleDateString('nb-NO')}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto">
              {documentUrl && viewingDocument && (
                <div className="h-full w-full">
                  {viewingDocument.file_path.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <div className="relative">
                      {imageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                          <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                            <p className="text-sm text-muted-foreground">Laster {imageProgress}%</p>
                          </div>
                        </div>
                      )}
                      <img 
                        src={documentUrl} 
                        alt={viewingDocument.name} 
                        className={`max-w-full h-auto mx-auto transition-opacity duration-300 ${imageLoading ? 'opacity-50' : 'opacity-100'}`}
                        onLoad={(e) => {
                          const img = e.currentTarget
                          if (img.naturalWidth > 0) {
                            // Simulate progressive loading
                            setImageProgress(50)
                            setTimeout(() => {
                              setImageProgress(100)
                              setImageLoading(false)
                            }, 300)
                          }
                        }}
                        onLoadStart={() => {
                          setImageProgress(10)
                        }}
                      />
                    </div>
                  ) : viewingDocument.file_path.match(/\.pdf$/i) ? (
                    <iframe 
                      src={documentUrl} 
                      className="w-full h-full min-h-[600px] border-0"
                      title={viewingDocument.name}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <FileText className="h-16 w-16 text-muted-foreground" />
                      <p className="text-muted-foreground">Forhåndsvisning er ikke tilgjengelig for denne filtypen</p>
                      <Button onClick={() => handleDownload(viewingDocument)}>
                        <Download className="mr-2 h-4 w-4" />
                        Last ned for å åpne
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Lukk
              </Button>
              <Button onClick={() => viewingDocument && handleDownload(viewingDocument)}>
                <Download className="mr-2 h-4 w-4" />
                Last ned
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
