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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  IconArrowUp,
  IconCirclePlus,
  IconClipboard,
  IconLink,
  IconPaperclip,
  IconPlus,
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

export default function Ai04({
  onSubmit,
  compact = false,
}: {
  onSubmit?: (prompt: string, files?: AttachedFile[]) => void;
  compact?: boolean;
}) {
  const [prompt, setPrompt] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (prompt.trim() && onSubmit) {
      onSubmit(prompt.trim(), attachedFiles);
      setPrompt("");
      setAttachedFiles([]);
    }
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

  return (
    <div className="mx-auto flex w-full flex-col gap-4 p-3">
      {!compact && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-pretty text-center font-heading font-semibold text-[29px] text-foreground tracking-tighter sm:text-[32px] md:text-[46px]">
            Din digitale båtekspert
          </h1>
          <h2 className="text-center text-md md:text-xl text-muted-foreground">
            Få svar på alle dine båt- og motorrelaterte spørsmål på et blunk!
          </h2>
        </div>
      )}

      <div className={cn(
        "relative z-10 flex flex-col w-full mx-auto content-center",
        compact ? "max-w-full" : "max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150"
      )}>
        <form
          className="group overflow-visible rounded-xl border bg-background p-2 transition-all duration-200 focus-within:border-ring focus-within:shadow-sm hover:shadow-sm"
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onSubmit={handleSubmit}
        >
          {attachedFiles.length > 0 && (
            <div className="relative flex w-fit items-center gap-2 mb-2 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
              {attachedFiles.map((file) => (
                <Badge
                  variant="outline"
                  className="group/file relative h-6 max-w-30 cursor-pointer overflow-hidden text-[13px] transition-all hover:bg-accent hover:pr-6 px-0"
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
                    className="absolute right-1 z-10 rounded-sm p-0.5 text-muted-foreground opacity-0 transition-opacity focus-visible:bg-accent focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background group-hover/file:opacity-100"
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
            className="max-h-100 min-h-12 resize-none rounded-sm border-none bg-transparent p-1 text-sm shadow-none focus-visible:border-transparent focus-visible:ring-0 placeholder:text-muted-foreground/60"
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Hva lurer du på?"
            value={prompt}
          />

          <div className="flex items-center gap-1 mt-1">
            <div className="flex items-end gap-0.5 sm:gap-1">
              <input
                className="sr-only"
                multiple
                onChange={handleFileSelect}
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="ml-[-2px] h-7 w-7 rounded-md hover:bg-accent transition-colors"
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <IconPlus size={16} className="transition-transform group-hover:scale-110" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="max-w-xs rounded-2xl p-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                  <DropdownMenuGroup className="space-y-1">
                    <DropdownMenuItem
                      className="rounded-[calc(1rem-6px)] text-xs cursor-pointer transition-colors hover:bg-accent"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="flex items-center gap-2">
                        <IconPaperclip className="text-muted-foreground" size={16} />
                        <span>Legg til filer</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-[calc(1rem-6px)] text-xs cursor-pointer transition-colors hover:bg-accent">
                      <div className="flex items-center gap-2">
                        <IconLink className="text-muted-foreground" size={16} />
                        <span>Importer fra URL</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-[calc(1rem-6px)] text-xs cursor-pointer transition-colors hover:bg-accent">
                      <div className="flex items-center gap-2">
                        <IconClipboard className="text-muted-foreground" size={16} />
                        <span>Lim inn fra utklippstavle</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
              <Button
                className="h-7 w-7 rounded-md transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
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
              "absolute inset-0 flex items-center justify-center pointer-events-none z-20 rounded-[inherit] border-2 border-primary border-dashed bg-primary/5 backdrop-blur-sm text-foreground text-sm transition-opacity duration-200",
              isDragOver ? "opacity-100" : "opacity-0"
            )}
          >
            <span className="flex w-full items-center justify-center gap-2 font-medium">
              <IconCirclePlus className="min-w-4 animate-pulse" size={20} />
              Slipp filer her for å legge til som vedlegg
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
