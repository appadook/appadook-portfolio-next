"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEditorDraft } from "@/features/admin/hooks/useEditorDraft";
import { asId, asStringList, asText } from "@/features/admin/lib/normalizers";
import { getNextOrder } from "@/features/admin/lib/ordering";
import { useMutation } from "convex/react";
import {
  AlertTriangle,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import type { EntityInspectorProps } from "./adminShared";
import {
  getCardBody,
  getCardSubtitle,
  getCardTitle,
  parseFormValue,
  toFormValue,
} from "./adminShared";
import { EditorField, fieldGroup } from "./EditorField";
import { MediaUploadField } from "./MediaFields";

export function EntityInspector({
  config,
  selectedItem,
  mode,
  context,
  onModeChange,
  onSelectedIdChange,
  onClose,
  onDeleted,
  generateUploadUrl,
  resolveStorageUrl,
}: EntityInspectorProps) {
  const create = useMutation(config.createMutation);
  const update = useMutation(config.updateMutation);
  const remove = useMutation(config.deleteMutation);

  const initialForm: Record<string, string> = {};
  const source = mode === "edit" ? selectedItem : null;
  for (const field of config.fields)
    initialForm[field.key] =
      !source && field.key === "order"
        ? String(getNextOrder(config.items))
        : toFormValue(source?.[field.key], field.type);
  for (const field of config.mediaFields)
    initialForm[field.key] = asText(source?.[field.key]);
  const { form, setForm, baseVersion, dirty, recovered, saved, discard } =
    useEditorDraft(
      `portfolio-editor:${config.id}:${selectedItem?._id ?? "new"}`,
      initialForm,
      Number(selectedItem?.version ?? 0),
      mode === "edit" || mode === "create",
    );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastSaved, setLastSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSaving) return;
      setIsSaving(true);
      setError(null);

      try {
        const payload: Record<string, unknown> = {};

        for (const field of config.fields) {
          const raw = form[field.key] ?? "";
          if (field.required && field.type !== "number" && raw.trim() === "") {
            throw new Error(`${field.label} is required.`);
          }
          if (field.type === "select") {
            const selected = raw.trim();
            const allowedValues = (field.options ?? []).map(
              (option) => option.value,
            );
            if (selected !== "" && !allowedValues.includes(selected)) {
              throw new Error(
                `${field.label} must be one of: ${allowedValues.join(", ")}`,
              );
            }
          }
          payload[field.key] = parseFormValue(raw, field.type);
        }

        for (const mediaField of config.mediaFields) {
          const mediaValue = (form[mediaField.key] ?? "").trim();
          if (mediaField.required && mediaValue === "") {
            throw new Error(`${mediaField.label} is required.`);
          }
          payload[mediaField.key] = mediaValue === "" ? undefined : mediaValue;
        }

        if (mode === "edit" && selectedItem) {
          await update({
            id: asId(selectedItem._id),
            expectedVersion: baseVersion,
            clearFields: Object.keys(payload).filter(
              (key) => payload[key] === undefined,
            ),
            ...payload,
          } as never);
          saved(baseVersion + 1);
          setLastSaved(true);
          return;
        }

        const createdId = await create(payload as never);
        saved();
        onSelectedIdChange(asId(createdId));
        onModeChange("edit");
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Failed to save item.",
        );
      } finally {
        setIsSaving(false);
      }
    },
    [
      baseVersion,
      isSaving,
      saved,
      config.fields,
      config.mediaFields,
      create,
      form,
      mode,
      onModeChange,
      onSelectedIdChange,
      selectedItem,
      update,
    ],
  );

  if (mode === "deleteConfirm" && selectedItem) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-display text-xl">Delete Item</h3>
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

        <p className="text-sm text-muted-foreground">
          The selected {config.title.toLowerCase()} item will be removed from
          your draft. Publish to update the live site.{" "}
          {config.id === "providers"
            ? "All certificates belonging to this provider will also be removed."
            : config.id === "about-categories"
              ? "All items in this category will also be removed."
              : ""}
        </p>

        <div className="rounded-lg border border-border/60 bg-background-subtle/40 p-3">
          <p className="font-medium text-foreground">
            {getCardTitle(config.id, selectedItem, context)}
          </p>
          <p className="mt-1 text-xs font-mono text-muted-foreground">
            id: {asId(selectedItem._id)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={async () => {
              setError(null);
              setIsDeleting(true);

              try {
                await remove({
                  id: asId(selectedItem._id),
                  expectedVersion: Number(selectedItem.version ?? 0),
                } as never);
                onDeleted();
              } catch (deleteError) {
                setError(
                  deleteError instanceof Error
                    ? deleteError.message
                    : "Failed to delete item.",
                );
              } finally {
                setIsDeleting(false);
              }
            }}
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
          <Button variant="outline" onClick={() => onModeChange("view")}>
            Cancel
          </Button>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (mode === "create" || (mode === "edit" && selectedItem)) {
    const singularTitle = config.title.endsWith("ies")
      ? `${config.title.slice(0, -3)}y`
      : config.title.endsWith("s")
        ? config.title.slice(0, -1)
        : config.title;

    return (
      <form
        className="space-y-4"
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.requestSubmit();
          }
        }}
        onSubmit={submit}
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
                ? `Create ${singularTitle}`
                : getCardTitle(config.id, selectedItem!, context)}
            </h3>
            <p className="text-sm text-muted-foreground">
              {config.description}
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

        <div>
          {["Overview", "Details", "Media", "Links", "Display"].map((group) => {
            const fields = config.fields.filter(
              (field) => fieldGroup(field.key) === group,
            );
            if (
              !fields.length &&
              !(group === "Media" && config.mediaFields.length)
            )
              return null;
            return (
              <fieldset key={group} className="admin-form-section">
                <legend>
                  {group === "Details" && config.id === "projects"
                    ? "Case study"
                    : group}
                </legend>
                <div className="admin-form-fields">
                  {fields.map((field) => (
                    <EditorField
                      key={field.key}
                      field={field}
                      value={form[field.key] ?? ""}
                      onChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          [field.key]: value,
                        }))
                      }
                    />
                  ))}
                  {group === "Media" &&
                    config.mediaFields.map((mediaField) => (
                      <div className="admin-field-wide" key={mediaField.key}>
                        <MediaUploadField
                          id={`${config.id}-${mediaField.key}`}
                          label={mediaField.label}
                          kind={mediaField.kind}
                          value={form[mediaField.key] ?? ""}
                          required={mediaField.required}
                          disabled={isSaving}
                          generateUploadUrl={generateUploadUrl}
                          resolveStorageUrl={resolveStorageUrl}
                          onChange={(url) =>
                            setForm((current) => ({
                              ...current,
                              [mediaField.key]: url ?? "",
                            }))
                          }
                        />
                      </div>
                    ))}
                </div>
              </fieldset>
            );
          })}
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="admin-editor-footer">
          <Button
            type="submit"
            disabled={isSaving || (mode === "edit" && !dirty)}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving
              ? "Saving..."
              : mode === "create"
                ? `Create ${singularTitle.toLowerCase()}`
                : "Save draft"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <small>⌘ / Ctrl + Enter to save</small>
        </div>
      </form>
    );
  }

  if (selectedItem) {
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl text-foreground">
              {getCardTitle(config.id, selectedItem, context)}
            </h3>
            <p className="text-sm text-muted-foreground">
              {getCardSubtitle(config.id, selectedItem, context)}
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

        {config.id === "projects" ||
        config.id === "certificates" ||
        config.id === "about-items" ? (
          asText(selectedItem.image) ? (
            <div className="relative h-44 w-full overflow-hidden rounded-lg border border-border/60">
              <Image
                src={asText(selectedItem.image)}
                alt={getCardTitle(config.id, selectedItem, context)}
                fill
                sizes="(max-width: 1280px) 100vw, 420px"
                className="object-cover"
              />
            </div>
          ) : null
        ) : null}

        {config.id === "experiences" && asText(selectedItem.logo) ? (
          <Image
            src={asText(selectedItem.logo)}
            alt={`${asText(selectedItem.company)} logo`}
            width={80}
            height={80}
            sizes="80px"
            className="h-20 w-20 rounded-lg border border-border/60 bg-background p-2 object-contain"
          />
        ) : null}

        {config.id === "languages" && asText(selectedItem.logoUrl) ? (
          <Image
            src={asText(selectedItem.logoUrl)}
            alt={`${asText(selectedItem.name)} logo`}
            width={96}
            height={96}
            sizes="96px"
            className="h-24 w-24 rounded-lg border border-border/60 bg-background p-2 object-contain"
          />
        ) : null}

        <div className="rounded-xl border border-border/60 bg-background-subtle/40 p-4">
          <p className="text-sm text-muted-foreground">
            {getCardBody(config.id, selectedItem, context)}
          </p>

          {config.id === "projects" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {asStringList(selectedItem.techStack).map((tech) => (
                <Badge key={tech} variant="outline">
                  {tech}
                </Badge>
              ))}
            </div>
          ) : null}

          {config.id === "experiences" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {asStringList(selectedItem.technologies).map((tech) => (
                <Badge key={tech} variant="outline">
                  {tech}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => onModeChange("edit")}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => onModeChange("deleteConfirm")}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-border/60 p-6 text-center">
      <p className="font-display text-xl text-foreground">No item selected</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Click any card to view details, or create a new item.
      </p>
      <Button className="mt-4" onClick={() => onModeChange("create")}>
        <Plus className="mr-2 h-4 w-4" />
        Create Item
      </Button>
    </div>
  );
}
