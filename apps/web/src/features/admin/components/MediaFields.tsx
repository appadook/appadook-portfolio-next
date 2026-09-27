"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MediaLibrary } from "./MediaLibrary";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { iconRegistry, iconRegistryEntries } from "@/data/iconRegistry";
import { uploadAssetWithSignedUrl } from "@/features/admin/api/uploadTransport";
import { cn } from "@/lib/utils";
import {
  FileText,
  Image as ImageIcon,
  Loader2,
  Search,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  IconPickerFieldProps,
  MediaUploadFieldProps,
} from "./adminShared";
import { UPLOAD_VALIDATION, validateUpload } from "./adminShared";

export function MediaUploadField({
  id,
  label,
  kind,
  value,
  required,
  disabled,
  onChange,
  generateUploadUrl,
  resolveStorageUrl,
}: MediaUploadFieldProps) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastFileName, setLastFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const uploadController = useRef<AbortController | null>(null);
  useEffect(() => () => uploadController.current?.abort(), []);
  const rule = UPLOAD_VALIDATION[kind];

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateUpload(file, kind);
      if (validationError) {
        setError(validationError);
        return;
      }

      uploadController.current?.abort();
      const controller = new AbortController();
      uploadController.current = controller;
      setError(null);
      setIsUploading(true);
      setProgress(0);

      try {
        const uploaded = await uploadAssetWithSignedUrl({
          file,
          onProgress: setProgress,
          signal: controller.signal,
          generateUploadUrl,
          resolveStorageUrl,
        });

        if (controller.signal.aborted) return;
        setProgress(100);
        setLastFileName(uploaded.fileName);
        onChange(uploaded.url, uploaded);
      } catch (uploadError) {
        setError(
          uploadError instanceof Error ? uploadError.message : "Upload failed.",
        );
      } finally {
        setProgress(0);
        setIsUploading(false);
        uploadController.current = null;
      }
    },
    [generateUploadUrl, kind, onChange, resolveStorageUrl],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={id}
          className="text-xs font-mono text-muted-foreground uppercase tracking-wider"
        >
          {label}
          {required ? " *" : ""}
        </label>
        <span className="text-[11px] text-muted-foreground">{rule.hint}</span>
      </div>

      <div
        className={cn(
          "rounded-xl border bg-background-subtle/30 p-3 transition-colors",
          isDragging
            ? "border-primary/70 ring-1 ring-primary/40"
            : "border-border/60",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file && !disabled && !isUploading) {
            void uploadFile(file);
          }
        }}
      >
        {kind === "resumePdf" ? (
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            {value ? (
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="underline-offset-4 hover:underline"
              >
                {lastFileName || "Open uploaded resume"}
              </a>
            ) : (
              <span>No file selected</span>
            )}
          </div>
        ) : (
          <div className="mb-3">
            {value ? (
              <div className="relative h-28 w-full overflow-hidden rounded-lg border border-border/60">
                <Image
                  src={value}
                  alt={label}
                  fill
                  sizes="(max-width: 1280px) 100vw, 420px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-28 w-full items-center justify-center rounded-lg border border-dashed border-border/70 text-muted-foreground">
                <ImageIcon className="h-5 w-5" />
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-border/70"
            disabled={disabled || isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isUploading
              ? "Uploading..."
              : value
                ? "Replace File"
                : "Upload File"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            disabled={disabled || isUploading}
            onClick={() => setLibraryOpen(true)}
          >
            Choose from library
          </Button>
          {isUploading ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => uploadController.current?.abort()}
            >
              Cancel upload
            </Button>
          ) : null}
          {value ? (
            <Button
              type="button"
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={() => {
                setError(null);
                setLastFileName(null);
                onChange(null, null);
              }}
              disabled={disabled || isUploading}
            >
              <X className="mr-2 h-4 w-4" />
              Remove
            </Button>
          ) : null}

          <input
            ref={inputRef}
            id={id}
            type="file"
            className="hidden"
            accept={rule.mimeTypes.join(",")}
            disabled={disabled || isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file && !disabled && !isUploading) {
                void uploadFile(file);
              }
              event.currentTarget.value = "";
            }}
          />
        </div>

        {isUploading ? (
          <div className="mt-3 space-y-1">
            <Progress value={progress} className="h-1.5" />
            <p className="text-xs text-muted-foreground">
              Processing upload...
            </p>
          </div>
        ) : null}
      </div>

      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="admin-workspace max-w-4xl max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose {label.toLowerCase()}</DialogTitle>
            <DialogDescription>
              Select a compatible file from your media library.
            </DialogDescription>
          </DialogHeader>
          {libraryOpen && (
            <MediaLibrary
              kind={kind}
              onSelect={(url) => {
                onChange(url, null);
                setLibraryOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function IconPickerField({
  label,
  value,
  required,
  onChange,
}: IconPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return iconRegistryEntries;
    const q = search.toLowerCase();
    return iconRegistryEntries.filter((entry) =>
      entry.key.toLowerCase().includes(q),
    );
  }, [search]);

  const SelectedIcon = iconRegistry[value ?? ""];

  return (
    <div className="space-y-2">
      <span className="mb-2 block text-xs font-mono text-muted-foreground uppercase tracking-wider">
        {label}
        {required ? " *" : ""}
      </span>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setSearch("");
          }}
          className="flex items-center gap-2 rounded-lg border border-border/60 bg-background-subtle/30 px-3 py-2 text-sm hover:border-primary/40 transition-colors"
        >
          {SelectedIcon ? (
            <>
              <SelectedIcon className="h-5 w-5 text-primary" />
              <span className="font-mono text-xs">{value}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Select icon…</span>
          )}
        </button>

        {value && (
          <button
            type="button"
            className="text-xs text-destructive hover:underline"
            onClick={() => onChange("")}
          >
            Clear
          </button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="admin-workspace max-w-lg">
          <DialogHeader>
            <DialogTitle>Choose an icon</DialogTitle>
            <DialogDescription>
              Search by name, then select an icon.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              aria-label="Search icons"
              placeholder="Search icons…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="grid grid-cols-6 gap-1 p-3 max-h-[50vh] overflow-y-auto">
            {filtered.map((entry) => {
              const Icon = entry.icon;
              const isActive = entry.key === value;
              return (
                <button
                  key={entry.key}
                  type="button"
                  title={entry.key}
                  onClick={() => {
                    onChange(entry.key);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors",
                    isActive
                      ? "bg-primary/15 border border-primary/30"
                      : "hover:bg-primary/[0.06] border border-transparent",
                  )}
                >
                  <Icon className="h-5 w-5 text-foreground" />
                  <span className="text-[8px] leading-tight text-muted-foreground truncate w-full text-center">
                    {entry.key.replace(/^(Si|Fa)/, "")}
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-6 py-8 text-center text-sm text-muted-foreground">
                No icons match &ldquo;{search}&rdquo;
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
