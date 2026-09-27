"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { iconRegistry } from "@/data/iconRegistry";
import { TECHNOLOGY_CATEGORY_OPTIONS } from "@/features/admin/config/sectionConfigs";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { IconPickerField, MediaUploadField } from "./MediaFields";
import type {
  TechBatchToolbarProps,
  TechEditableCardProps,
} from "./adminShared";

export function TechBatchToolbar({
  hasChanges,
  isSaving,
  onAdd,
  onSave,
  onCancel,
}: TechBatchToolbarProps) {
  return (
    <div className="border-y border-border py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Technologies</p>
          <p className="text-xs text-muted-foreground">
            Edit inline, add or remove items, then save all changes at once.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasChanges ? <Badge variant="outline">Unsaved changes</Badge> : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAdd}
            disabled={isSaving}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Technology
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSaving || !hasChanges}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TechEditableCard({
  item,
  onFieldChange,
  onToggleExpand,
  onDelete,
  generateUploadUrl,
  resolveStorageUrl,
}: TechEditableCardProps) {
  const SelectedIcon = iconRegistry[item.iconName];

  if (item._isExpanded) {
    return (
      <div className="border-b border-border py-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {item._isNew ? (
              <Badge variant="outline" className="text-xs">
                New
              </Badge>
            ) : null}
            <span className="font-display text-sm text-foreground">
              {item.name || "New Technology"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Remove ${item.name || "technology"} from batch`}
              onClick={() => onDelete(item._id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`${item._isExpanded ? "Collapse" : "Expand"} ${item.name || "technology"}`}
              onClick={() => onToggleExpand(item._id)}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Name *
            </span>
            <input
              type="text"
              className="w-full rounded-lg border border-border/60 bg-background-subtle/30 px-3 py-2 text-sm"
              value={item.name}
              onChange={(e) => onFieldChange(item._id, "name", e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Category *
            </span>
            <select
              className="w-full rounded-lg border border-border/60 bg-background-subtle/30 px-3 py-2 text-sm"
              value={item.category}
              onChange={(e) =>
                onFieldChange(item._id, "category", e.target.value)
              }
            >
              <option value="">Select category</option>
              {TECHNOLOGY_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block space-y-1">
          <span className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Description
          </span>
          <textarea
            className="w-full rounded-lg border border-border/60 bg-background-subtle/30 px-3 py-2 text-sm"
            rows={2}
            value={item.description}
            onChange={(e) =>
              onFieldChange(item._id, "description", e.target.value)
            }
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <IconPickerField
            label="Icon"
            value={item.iconName}
            onChange={(v) => onFieldChange(item._id, "iconName", v)}
          />
          <label className="space-y-1">
            <span className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Display Order *
            </span>
            <input
              type="number"
              className="w-full rounded-lg border border-border/60 bg-background-subtle/30 px-3 py-2 text-sm"
              value={item.order}
              onChange={(e) =>
                onFieldChange(item._id, "order", Number(e.target.value) || 0)
              }
            />
          </label>
        </div>

        <MediaUploadField
          id={`tech-icon-${item._id}`}
          label="Custom Icon Image"
          kind="logo"
          value={item.iconUrl}
          onChange={(url) => onFieldChange(item._id, "iconUrl", url ?? "")}
          generateUploadUrl={generateUploadUrl}
          resolveStorageUrl={resolveStorageUrl}
        />
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-background-subtle/30 p-3 transition-all hover:border-primary/30">
      <button
        type="button"
        className="flex flex-1 items-center gap-3 text-left"
        aria-label={`${item._isExpanded ? "Collapse" : "Expand"} ${item.name || "technology"}`}
        onClick={() => onToggleExpand(item._id)}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-background text-foreground">
          {SelectedIcon ? (
            <SelectedIcon className="h-5 w-5" />
          ) : (
            <span className="text-xs font-mono">{item.order}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {item.name || "Untitled"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {item.category || "No category"}
          </p>
        </div>
        {item._isNew ? (
          <Badge variant="outline" className="text-xs">
            New
          </Badge>
        ) : null}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={`Remove ${item.name || "technology"} from batch`}
        onClick={() => onDelete(item._id)}
      >
        <Trash2 className="h-4 w-4 text-destructive/60 group-hover:text-destructive" />
      </Button>
    </div>
  );
}
