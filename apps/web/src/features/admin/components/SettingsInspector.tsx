"use client";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { adminApi } from "@/features/admin/api/convexAdmin";
import { useEditorDraft } from "@/features/admin/hooks/useEditorDraft";
import { asText } from "@/features/admin/lib/normalizers";
import { useMutation } from "convex/react";
import { Pencil, Plus, Save, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { MediaUploadField } from "./MediaFields";
import type {
  ItemInspectorDrawerProps,
  ItemInspectorPanelProps,
  SiteSettingsInspectorProps,
} from "./adminShared";

export function SiteSettingsInspector({
  revision,
  mode,
  settings,
  onModeChange,
  onClose,
  generateUploadUrl,
  resolveStorageUrl,
}: SiteSettingsInspectorProps) {
  const upsert = useMutation(adminApi.upsertSiteSettings);

  const { form, setForm, baseVersion, dirty, recovered, saved, discard } =
    useEditorDraft(
      "portfolio-editor:settings",
      {
        siteName: asText(settings?.siteName),
        tagline: asText(settings?.tagline),
        logoUrl: asText(settings?.logoUrl),
        profileImageUrl: asText(settings?.profileImageUrl),
        resumeUrl: asText(settings?.resumeUrl),
      },
      revision,
      mode === "edit" || mode === "create",
    );
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (mode === "edit" || mode === "create") {
    return (
      <form
        className="space-y-4"
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.requestSubmit();
          }
        }}
        onSubmit={async (event) => {
          event.preventDefault();
          setIsSaving(true);
          setError(null);

          try {
            await upsert({
              expectedRevision: baseVersion,
              siteName: form.siteName.trim() || undefined,
              tagline: form.tagline.trim() || undefined,
              logoUrl: form.logoUrl.trim() || undefined,
              profileImageUrl: form.profileImageUrl.trim() || undefined,
              resumeUrl: form.resumeUrl.trim() || undefined,
            });
            saved(baseVersion + 1);
            setLastSaved(true);
          } catch (saveError) {
            setError(
              saveError instanceof Error
                ? saveError.message
                : "Failed to save site settings.",
            );
          } finally {
            setIsSaving(false);
          }
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p role="status" className="text-xs text-muted-foreground">
              {recovered ? "Recovered draft · " : ""}
              {dirty
                ? "Unsaved edits"
                : lastSaved
                  ? "Saved draft · Not yet published"
                  : "Saved draft"}
            </p>
            {dirty || recovered ? (
              <button
                type="button"
                className="text-xs text-primary underline"
                onClick={discard}
              >
                Discard draft and reload saved version
              </button>
            ) : null}
            <h3 className="font-display text-xl text-foreground">
              {mode === "create"
                ? "Create Site Settings"
                : "Edit Site Settings"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Control branding and hero defaults for the public site.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close editor"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <label>
          <span className="mb-2 block text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Site Name
          </span>
          <input
            className="w-full rounded-lg border border-border/60 bg-background-subtle/30 px-3 py-2"
            value={form.siteName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                siteName: event.target.value,
              }))
            }
          />
        </label>

        <label>
          <span className="mb-2 block text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Tagline
          </span>
          <textarea
            className="min-h-20 w-full rounded-lg border border-border/60 bg-background-subtle/30 px-3 py-2"
            value={form.tagline}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                tagline: event.target.value,
              }))
            }
          />
        </label>

        <MediaUploadField
          id="site-settings-logo"
          label="Logo"
          kind="logo"
          value={form.logoUrl}
          generateUploadUrl={generateUploadUrl}
          resolveStorageUrl={resolveStorageUrl}
          disabled={isSaving}
          onChange={(nextUrl) =>
            setForm((current) => ({ ...current, logoUrl: nextUrl ?? "" }))
          }
        />

        <MediaUploadField
          id="site-settings-profile"
          label="Profile Image"
          kind="image"
          value={form.profileImageUrl}
          generateUploadUrl={generateUploadUrl}
          resolveStorageUrl={resolveStorageUrl}
          disabled={isSaving}
          onChange={(nextUrl) =>
            setForm((current) => ({
              ...current,
              profileImageUrl: nextUrl ?? "",
            }))
          }
        />

        <MediaUploadField
          id="site-settings-resume"
          label="Resume PDF"
          kind="resumePdf"
          value={form.resumeUrl}
          generateUploadUrl={generateUploadUrl}
          resolveStorageUrl={resolveStorageUrl}
          disabled={isSaving}
          onChange={(nextUrl) =>
            setForm((current) => ({ ...current, resumeUrl: nextUrl ?? "" }))
          }
        />

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="admin-editor-footer">
          <Button type="submit" disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save draft"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </form>
    );
  }

  if (!settings) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 p-6 text-center">
        <p className="font-display text-xl text-foreground">
          No Site Settings Yet
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Create the singleton settings record to control branding and hero
          assets.
        </p>
        <Button className="mt-4" onClick={() => onModeChange("create")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Settings
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-foreground">
            {asText(settings.siteName, "Portfolio Settings")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {asText(settings.tagline, "No tagline configured yet.")}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close editor"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border/60 bg-background-subtle/40 p-3">
          <p className="mb-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Logo
          </p>
          {settings.logoUrl ? (
            <Image
              src={settings.logoUrl}
              alt="Site logo"
              width={80}
              height={80}
              sizes="80px"
              className="h-20 w-20 rounded-md border border-border/60 object-contain"
            />
          ) : (
            <p className="text-sm text-muted-foreground">No logo uploaded</p>
          )}
        </div>

        <div className="rounded-lg border border-border/60 bg-background-subtle/40 p-3">
          <p className="mb-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Profile Image
          </p>
          {settings.profileImageUrl ? (
            <Image
              src={settings.profileImageUrl}
              alt="Profile"
              width={80}
              height={80}
              sizes="80px"
              className="h-20 w-20 rounded-md border border-border/60 object-cover"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No profile image uploaded
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-background-subtle/40 p-3">
        <p className="mb-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Resume
        </p>
        {settings.resumeUrl ? (
          <a
            href={settings.resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Open uploaded resume
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">No resume uploaded</p>
        )}
      </div>

      <Button onClick={() => onModeChange("edit")}>
        <Pencil className="mr-2 h-4 w-4" />
        Edit Settings
      </Button>
    </div>
  );
}

export function ItemInspectorPanel({
  open,
  title,
  description,
  children,
}: ItemInspectorPanelProps) {
  return (
    <aside className="hidden xl:block">
      <div className="sticky top-48">
        <div className="max-h-[calc(100vh-7.5rem)] overflow-y-auto rounded-2xl border border-border/60 bg-background-subtle/20 p-5">
          {open ? (
            children
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 p-6 text-center">
              <p className="font-display text-xl text-foreground">
                {title} Inspector Closed
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {description ||
                  "Select a card or click create to open this section inspector."}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export function ItemInspectorDrawer({
  open,
  title,
  description,
  onOpenChange,
  children,
}: ItemInspectorDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader>
          <DrawerTitle className="font-display text-xl">{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
