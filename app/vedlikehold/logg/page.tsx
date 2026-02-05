"use client"

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MaintenanceLogTable } from "@/components/maintenance-log-table";
import { MaintenanceLogDialog } from "@/components/maintenance-log-dialog";

export default function Page() {
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
                                Vedlikehold
                            </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                            <BreadcrumbPage>Logg</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                
                <main className="flex flex-1 flex-col w-full mx-auto max-w-6xl gap-6 p-4 md:p-6 lg:p-8">
                    <div className="w-full space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="">
                                <h1 className="text-2xl font-bold tracking-tight">Vedlikeholdslogg</h1>
                                <p className="text-muted-foreground max-w-md">
                                    Hold oversikt over alle reparasjoner, service og vedlikehold av båten din.
                                </p>
                            </div>
                            <MaintenanceLogDialog />
                        </div>
                        <MaintenanceLogTable />
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
