"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MaintenanceLogDialog } from "@/components/maintenance-log-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  IconAdjustmentsHorizontal,
  IconArrowUp,
  IconBrandFigma,
  IconCamera,
  IconCirclePlus,
  IconClipboard,
  IconFileUpload,
  IconHistory,
  IconLayoutDashboard,
  IconLink,
  IconPaperclip,
  IconPlayerPlay,
  IconPlus,
  IconSparkles,
  IconTemplate,
  IconX,
} from "@tabler/icons-react";
import Image from "next/image";
import { useRef, useState } from "react";

interface AttachedFile {
  id: string;
  name: string;
  file: File;
  preview?: string;
}

const ACTIONS = [
  { id: "logg-vedlikehold", icon: IconFileUpload, label: "Logg vedlikehold" },
  { id: "legg-til-dokument", icon: IconPaperclip, label: "Legg til dokument" },
  { id: "motor-info", icon: IconLayoutDashboard, label: "Motorinformasjon" },
  { id: "opprett-paaminnelse", icon: IconHistory, label: "Opprett påminnelse" },
];

export default function Ai04({
  onSubmit,
  compact = false,
}: {
  onSubmit?: (prompt: string) => void;
  compact?: boolean;
}) {
  const [prompt, setPrompt] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [motorDialogOpen, setMotorDialogOpen] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);

  const [settings, setSettings] = useState({
    autoComplete: true,
    streaming: false,
    showHistory: false,
  });

  const generateFileId = () => Math.random().toString(36).substring(7);
  const processFiles = (files: File[]) => {
    for (const file of files) {
      const fileId = generateFileId();
      const attachedFile: AttachedFile = {
        id: fileId,
        name: file.name,
        file,
      };

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setAttachedFiles((prev) =>
            prev.map((f) =>
              f.id === fileId ? { ...f, preview: reader.result as string } : f
            )
          );
        };
        reader.readAsDataURL(file);
      }

      setAttachedFiles((prev) => [...prev, attachedFile]);
    }
  };
  const submitPrompt = () => {
    console.log("hei", onSubmit)
    if (prompt.trim() && onSubmit) {
      onSubmit(prompt.trim());
      setPrompt("");
    }
  };
  const updateSetting = (key: keyof typeof settings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitPrompt();
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  };
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitPrompt();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const handleActionClick = (actionId: string) => {
    switch (actionId) {
      case "logg-vedlikehold":
        setMaintenanceDialogOpen(true);
        break;
      case "legg-til-dokument":
        fileInputRef.current?.click();
        break;
      case "motor-info":
        setMotorDialogOpen(true);
        break;
      case "opprett-paaminnelse":
        setReminderDialogOpen(true);
        break;
    }
  };

  return (
    <div className="mx-auto flex w-full flex-col gap-4 p-3">
      {!compact && (
        <>
          <h1 className="text-pretty text-center font-heading font-semibold text-[29px] text-foreground tracking-tighter sm:text-[32px] md:text-[46px]">
            Din digitale båtekspert
          </h1>
          <h2 className="-my-5 pb-4 text-center text-md md:text-xl text-muted-foreground">
            Få svar på alle dine båt- og motorrelaterte spørsmål på et blunk!
          </h2>
        </>
      )}

      <div className={cn("relative z-10 flex flex-col w-full mx-auto content-center", compact ? "max-w-full" : "max-w-2xl")}>
        <form
          className="overflow-visible rounded-xl border p-2 transition-colors duration-200 focus-within:border-ring"
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onSubmit={handleSubmit}
        >
          {attachedFiles.length > 0 && (
            <div className="relative flex w-fit items-center gap-2 mb-2 overflow-hidden">
              {attachedFiles.map((file) => (
                <Badge
                  variant="outline"
                  className="group relative h-6 max-w-30 cursor-pointer overflow-hidden text-[13px] transition-colors hover:bg-accent px-0"
                  key={file.id}
                >
                  <span className="flex h-full items-center gap-1.5 overflow-hidden pl-1 font-normal">
                    <div className="relative flex h-4 min-w-4 items-center justify-center">
                      {file.preview ? (
                        <Image
                          alt={file.name}
                          className="absolute inset-0 h-4 w-4 rounded border object-cover"
                          src={file.preview}
                          width={16}
                          height={16}
                        />
                      ) : (
                        <IconPaperclip className="opacity-60" size={12} />
                      )}
                    </div>
                    <span className="inline overflow-hidden truncate pr-1.5 transition-all">
                      {file.name}
                    </span>
                  </span>
                  <button
                    className="absolute right-1 z-10 rounded-sm p-0.5 text-muted-foreground opacity-0 focus-visible:bg-accent focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background group-hover:opacity-100"
                    onClick={() => handleRemoveFile(file.id)}
                    type="button"
                  >
                    <IconX size={12} />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <Textarea
            className="max-h-100 min-h-12 resize-none rounded-none border-none bg-transparent! p-0 text-sm shadow-none focus-visible:border-transparent focus-visible:ring-0"
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Hva lurer du på?"
            value={prompt}
          />

          <div className="flex items-center gap-1">
            <div className="flex items-end gap-0.5 sm:gap-1">
              <input
                className="sr-only"
                multiple
                onChange={handleFileSelect}
                ref={fileInputRef}
                type="file"
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="ml-[-2px] h-7 w-7 rounded-md"
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <IconPlus size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="max-w-xs rounded-2xl p-1.5"
                >
                  <DropdownMenuGroup className="space-y-1">
                    <DropdownMenuItem
                      className="rounded-[calc(1rem-6px)] text-xs"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="flex items-center gap-2">
                        <IconPaperclip className="text-muted-foreground" size={16} />
                        <span>Attach Files</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-[calc(1rem-6px)] text-xs">
                      <div className="flex items-center gap-2">
                        <IconLink className="text-muted-foreground" size={16} />
                        <span>Import from URL</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-[calc(1rem-6px)] text-xs">
                      <div className="flex items-center gap-2">
                        <IconClipboard className="text-muted-foreground" size={16} />
                        <span>Paste from Clipboard</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-[calc(1rem-6px)] text-xs">
                      <div className="flex items-center gap-2">
                        <IconTemplate className="text-muted-foreground" size={16} />
                        <span>Use Template</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="size-7 rounded-md"
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <IconAdjustmentsHorizontal size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-48 rounded-2xl p-3"
                >
                  <DropdownMenuGroup className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconSparkles className="text-muted-foreground" size={16} />
                        <Label className="text-xs">Auto-complete</Label>
                      </div>
                      <Switch
                        checked={settings.autoComplete}
                        className="scale-75"
                        onCheckedChange={(value) =>
                          updateSetting("autoComplete", value)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconPlayerPlay className="text-muted-foreground" size={16} />
                        <Label className="text-xs">Streaming</Label>
                      </div>
                      <Switch
                        checked={settings.streaming}
                        className="scale-75"
                        onCheckedChange={(value) =>
                          updateSetting("streaming", value)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconHistory className="text-muted-foreground" size={16} />
                        <Label className="text-xs">Show History</Label>
                      </div>
                      <Switch
                        checked={settings.showHistory}
                        className="scale-75"
                        onCheckedChange={(value) =>
                          updateSetting("showHistory", value)
                        }
                      />
                    </div>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
              <Button
                className="h-7 w-7 rounded-md"
                disabled={!prompt.trim()}
                size="icon"
                type="submit"
                variant="default"
              >
                <IconArrowUp size={16} />
              </Button>
            </div>
          </div>

          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center pointer-events-none z-20 rounded-[inherit] border border-border border-dashed bg-muted text-foreground text-sm transition-opacity duration-200",
              isDragOver ? "opacity-100" : "opacity-0"
            )}
          >
            <span className="flex w-full items-center justify-center gap-1 font-medium">
              <IconCirclePlus className="min-w-4" size={16} />
              Drop files here to add as attachments
            </span>
          </div>
        </form>
      </div>

      {!compact && (
        <div className="max-w-250 mx-auto flex-wrap gap-3 flex min-h-0 shrink-0 items-center justify-center">
          {ACTIONS.map((action) => (
            <Button
              className="gap-2 rounded-full"
              key={action.id}
              size="sm"
              variant="outline"
              onClick={() => handleActionClick(action.id)}
            >
              <action.icon size={16} />
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <MaintenanceLogDialog
        onSuccess={() => {
          setMaintenanceDialogOpen(false);
        }}
      />

      <Dialog open={motorDialogOpen} onOpenChange={setMotorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motorinformasjon</DialogTitle>
            <DialogDescription>
              Legg til eller oppdater informasjon om båtens motor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="motor-model">Motormodell</Label>
              <input
                id="motor-model"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="F.eks. Yamaha 150"
              />
            </div>
            <div>
              <Label htmlFor="motor-hours">Motortimer</Label>
              <input
                id="motor-hours"
                type="number"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Timer"
              />
            </div>
            <div>
              <Label htmlFor="motor-year">Årsmodell</Label>
              <input
                id="motor-year"
                type="number"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="År"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setMotorDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={() => setMotorDialogOpen(false)}>
              Lagre
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Opprett påminnelse</DialogTitle>
            <DialogDescription>
              Sett opp en påminnelse for vedlikehold av båten.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reminder-title">Tittel</Label>
              <input
                id="reminder-title"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="F.eks. Oljeskift"
              />
            </div>
            <div>
              <Label htmlFor="reminder-date">Dato</Label>
              <input
                id="reminder-date"
                type="date"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div>
              <Label htmlFor="reminder-notes">Notater</Label>
              <Textarea
                id="reminder-notes"
                placeholder="Legg til notater..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setReminderDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={() => setReminderDialogOpen(false)}>
              Opprett
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
