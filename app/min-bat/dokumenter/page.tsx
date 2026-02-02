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
  FileText, 
  Plus, 
  Upload, 
  Download,
  Shield,
  FileCheck,
  AlertCircle,
} from "lucide-react"
import { useState } from "react"

interface Document {
  id: string
  name: string
  type: string
  uploadDate: string
  expiryDate?: string
  status: "valid" | "expiring-soon" | "expired"
}

export default function DokumenterPage() {
  const [documents] = useState<Document[]>([
    {
      id: "1",
      name: "Båtforsikring 2026",
      type: "Forsikring",
      uploadDate: "2026-01-01",
      expiryDate: "2026-12-31",
      status: "valid",
    },
    {
      id: "2",
      name: "Registreringsbevis",
      type: "Registrering",
      uploadDate: "2025-03-15",
      status: "valid",
    },
    {
      id: "3",
      name: "Kjøpekontrakt",
      type: "Kontrakt",
      uploadDate: "2024-05-20",
      status: "valid",
    },
    {
      id: "4",
      name: "Sikkerhetsutstyr sertifikat",
      type: "Sertifikat",
      uploadDate: "2025-04-10",
      expiryDate: "2026-04-10",
      status: "expiring-soon",
    },
  ])

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
        <header className="flex h-16 shrink-0 items-center gap-2">
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

        <main className="flex flex-1 flex-col items-center px-4 py-6 sm:px-6 md:px-8 lg:px-12">
          <div className="w-full max-w-5xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Dokumenter</h1>
                  <p className="text-muted-foreground">
                    Båtpapirer, forsikring og andre viktige dokumenter
                  </p>
                </div>
              </div>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Last opp dokument
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Totalt dokumenter
                </div>
                <div className="mt-2 text-2xl font-bold">{documents.length}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileCheck className="h-4 w-4 text-green-600" />
                  Gyldige
                </div>
                <div className="mt-2 text-2xl font-bold text-green-600">
                  {documents.filter(d => d.status === "valid").length}
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  Utløper snart
                </div>
                <div className="mt-2 text-2xl font-bold text-yellow-600">
                  {documents.filter(d => d.status === "expiring-soon").length}
                </div>
              </div>
            </div>

            {/* Document List */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Dokumentarkiv</h2>
              {documents.map((doc) => {
                const Icon = getTypeIcon(doc.type)
                return (
                  <div key={doc.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1 rounded-full bg-primary/10 p-2">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{doc.name}</h3>
                            {getStatusBadge(doc.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Type: {doc.type}
                          </p>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>
                              Lastet opp: {new Date(doc.uploadDate).toLocaleDateString('nb-NO')}
                            </span>
                            {doc.expiryDate && (
                              <span>
                                Utløper: {new Date(doc.expiryDate).toLocaleDateString('nb-NO')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          Vis
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Upload Area */}
            <div className="rounded-lg border-2 border-dashed p-8 text-center space-y-3">
              <div className="mx-auto rounded-full bg-muted p-4 w-fit">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Dra og slipp dokumenter her</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  eller klikk for å velge filer fra datamaskinen din
                </p>
              </div>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Velg filer
              </Button>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
