"use client";
import { type UploadedStorageAsset } from "@/features/admin/api/uploadTransport";
import { asId, asStringList, asText } from "@/features/admin/lib/normalizers";
import type {
  AdminEntity,
  AdminSectionConfig,
  BootstrapData,
  EntitySectionId,
  FieldType,
  InspectorMode,
  MediaFieldConfig,
  SectionId,
  SiteSettingsEntity,
} from "@/features/admin/types";
import type { Id } from "@portfolio/backend/convex/_generated/dataModel";
import { type ReactNode } from "react";

export type ReorderItem = {
  id: string;
  order: number;
};

export type DraftOrder = string[] | null;

export type ProjectDraftOrder = DraftOrder;

export type ExperienceDraftOrder = DraftOrder;

export type TechDraftItem = {
  _id: string;
  name: string;
  category: string;
  description: string;
  iconName: string;
  iconUrl: string;
  order: number;
  _isNew?: boolean;
  _isDeleted?: boolean;
  _isExpanded?: boolean;
};

export type UploadValidationRule = {
  maxBytes: number;
  mimeTypes: string[];
  hint: string;
};

export type UploadFieldKind = MediaFieldConfig["kind"];

export type LookupContext = {
  aboutCategoryMap: Map<string, AdminEntity>;
  providerMap: Map<string, AdminEntity>;
  certificateCountByProvider: Map<string, number>;
};

export const MAX_MB = 1024 * 1024;

export const UPLOAD_VALIDATION: Record<UploadFieldKind, UploadValidationRule> =
  {
    image: {
      maxBytes: 5 * MAX_MB,
      mimeTypes: ["image/jpeg", "image/png", "image/webp"],
      hint: "PNG, JPG, or WEBP up to 5MB",
    },
    logo: {
      maxBytes: 3 * MAX_MB,
      mimeTypes: ["image/jpeg", "image/png", "image/webp"],
      hint: "PNG, JPG, or WEBP up to 3MB",
    },
    resumePdf: {
      maxBytes: 10 * MAX_MB,
      mimeTypes: ["application/pdf"],
      hint: "PDF up to 10MB",
    },
  };

export const DEFAULT_BOOTSTRAP: BootstrapData = {
  siteSettings: null,
  experiences: [],
  projects: [],
  programmingLanguages: [],
  technologies: [],
  cloudProviders: [],
  certificates: [],
  aboutCategories: [],
  aboutItems: [],
};

export const ADMIN_TABS: Array<{ id: SectionId; label: string }> = [
  { id: "site-settings", label: "Site Settings" },
  { id: "experiences", label: "Experiences" },
  { id: "projects", label: "Projects" },
  { id: "languages", label: "Programming Languages" },
  { id: "technologies", label: "Technologies" },
  { id: "providers", label: "Cloud Providers" },
  { id: "certificates", label: "Certificates" },
  { id: "about-categories", label: "About Categories" },
  { id: "about-items", label: "About Items" },
];

export function toFormValue(value: unknown, type: FieldType): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (type === "csv") {
    return Array.isArray(value) ? value.join(", ") : String(value);
  }

  if (type === "list") {
    return Array.isArray(value) ? value.join("\n") : String(value);
  }

  return String(value);
}

export function parseFormValue(raw: string, type: FieldType): unknown {
  if (type === "number") {
    const parsed = Number(raw || 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (type === "csv") {
    return raw
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean);
  }

  if (type === "list") {
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return raw.trim() === "" ? undefined : raw.trim();
}

export function validateUpload(
  file: File,
  kind: UploadFieldKind,
): string | null {
  const rule = UPLOAD_VALIDATION[kind];

  if (!rule.mimeTypes.includes(file.type)) {
    return `Invalid file type. Expected ${rule.hint}.`;
  }

  if (file.size > rule.maxBytes) {
    return `File is too large. Expected ${rule.hint}.`;
  }

  return null;
}

export function getSectionItems(
  sectionId: EntitySectionId,
  bootstrap: BootstrapData,
): AdminEntity[] {
  switch (sectionId) {
    case "experiences":
      return bootstrap.experiences;
    case "projects":
      return bootstrap.projects;
    case "languages":
      return bootstrap.programmingLanguages;
    case "technologies":
      return bootstrap.technologies;
    case "providers":
      return bootstrap.cloudProviders;
    case "certificates":
      return bootstrap.certificates;
    case "about-categories":
      return bootstrap.aboutCategories;
    case "about-items":
      return bootstrap.aboutItems;
  }
}

export function getCardTitle(
  sectionId: EntitySectionId,
  item: AdminEntity,
  context: LookupContext,
): string {
  if (sectionId === "experiences") {
    return `${asText(item.company)} · ${asText(item.role)}`;
  }

  if (sectionId === "projects") {
    return asText(item.title, "Untitled project");
  }

  if (sectionId === "languages") {
    return asText(item.name, "Programming language");
  }

  if (sectionId === "technologies") {
    return asText(item.name, "Technology");
  }

  if (sectionId === "providers") {
    return asText(item.name, "Cloud provider");
  }

  if (sectionId === "certificates") {
    return asText(item.name, "Certificate");
  }

  if (sectionId === "about-categories") {
    return asText(item.label, "About category");
  }

  if (sectionId === "about-items") {
    const category = context.aboutCategoryMap.get(asText(item.categoryId));
    return category
      ? `${asText(item.title)} · ${asText(category.label)}`
      : asText(item.title, "About item");
  }

  return "Item";
}

export function getCardSubtitle(
  sectionId: EntitySectionId,
  item: AdminEntity,
  context: LookupContext,
): string {
  if (sectionId === "experiences") {
    return `${asText(item.location)} · ${asText(item.duration)}`;
  }

  if (sectionId === "projects") {
    return asStringList(item.categories).join(" · ");
  }

  if (sectionId === "languages") {
    return `Level: ${asText(item.level)}`;
  }

  if (sectionId === "technologies") {
    return `Category: ${asText(item.category)}`;
  }

  if (sectionId === "providers") {
    return `${context.certificateCountByProvider.get(asId(item._id)) ?? 0} linked certificates`;
  }

  if (sectionId === "certificates") {
    const provider = context.providerMap.get(asText(item.providerId));
    return `${provider ? asText(provider.name) : "Unknown provider"} · ${asText(item.year)}`;
  }

  if (sectionId === "about-categories") {
    return asText(item.name);
  }

  if (sectionId === "about-items") {
    return asText(item.subtitle) || asText(item.date);
  }

  return "";
}

export function getCardBody(
  sectionId: EntitySectionId,
  item: AdminEntity,
  context: LookupContext,
): string {
  if (sectionId === "experiences") {
    return asText(item.description, "No description yet.");
  }

  if (sectionId === "projects") {
    return asText(item.description, "No description yet.");
  }

  if (sectionId === "languages") {
    return asText(item.description, "No description yet.");
  }

  if (sectionId === "technologies") {
    return asText(item.description, `Icon: ${asText(item.iconName, "n/a")}`);
  }

  if (sectionId === "providers") {
    return `Display order: ${Number(item.order ?? 0)}`;
  }

  if (sectionId === "certificates") {
    return asText(item.description, asText(item.issuer, "No description yet."));
  }

  if (sectionId === "about-categories") {
    return `Color: ${asText(item.color)} | Icon: ${asText(item.icon)}`;
  }

  if (sectionId === "about-items") {
    const category = context.aboutCategoryMap.get(asText(item.categoryId));
    return `${asText(item.description, "No description yet.")} ${category ? `(Category: ${asText(category.label)})` : ""}`.trim();
  }

  return "";
}

export type MediaUploadFieldProps = {
  id: string;
  label: string;
  kind: UploadFieldKind;
  value: string;
  required?: boolean;
  disabled?: boolean;
  // Keep uploaded asset metadata available for future persistence enhancements.
  onChange: (
    nextUrl: string | null,
    uploadedAsset?: UploadedStorageAsset | null,
  ) => void;
  generateUploadUrl: () => Promise<string>;
  resolveStorageUrl: (args: {
    storageId: Id<"_storage">;
  }) => Promise<string | null>;
};

export type IconPickerFieldProps = {
  label: string;
  value: string;
  required?: boolean;
  onChange: (nextValue: string) => void;
};

export type EmptyStateProps = {
  title: string;
  description: string;
  onCreate: () => void;
};

export type SectionCardProps = {
  sectionId: EntitySectionId;
  item: AdminEntity;
  context: LookupContext;
  isSelected: boolean;
  orderLabel?: string;
  dragHandle?: ReactNode;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export type SectionCardGridProps = {
  config: AdminSectionConfig;
  items: AdminEntity[];
  selectedItemId: string | null;
  context: LookupContext;
  onCreate: () => void;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export type ProjectOrderToolbarProps = {
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
};

export type ExperienceCurrentRoleOption = {
  id: string;
  label: string;
};

export type ExperienceLayoutToolbarProps = {
  hasChanges: boolean;
  isSaving: boolean;
  currentRoleId: string | null;
  currentRoleOptions: ExperienceCurrentRoleOption[];
  onCurrentRoleChange: (nextCurrentRoleId: string | null) => void;
  onSave: () => void;
  onReset: () => void;
};

export type TechBatchToolbarProps = {
  hasChanges: boolean;
  isSaving: boolean;
  onAdd: () => void;
  onSave: () => void;
  onCancel: () => void;
};

export type TechEditableCardProps = {
  item: TechDraftItem;
  onFieldChange: (
    id: string,
    field: keyof TechDraftItem,
    value: string | number,
  ) => void;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string) => void;
  generateUploadUrl: () => Promise<string>;
  resolveStorageUrl: (args: {
    storageId: Id<"_storage">;
  }) => Promise<string | null>;
};

export type SortableProjectCardProps = {
  item: AdminEntity;
  position: number;
  context: LookupContext;
  isSelected: boolean;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export type SortableProjectGridProps = {
  items: AdminEntity[];
  selectedItemId: string | null;
  context: LookupContext;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (nextIds: string[]) => void;
};

export type SortableExperienceCardProps = {
  item: AdminEntity;
  position: number;
  context: LookupContext;
  isSelected: boolean;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export type SortableExperienceGridProps = {
  items: AdminEntity[];
  selectedItemId: string | null;
  context: LookupContext;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (nextIds: string[]) => void;
};

export type EntityInspectorProps = {
  config: AdminSectionConfig;
  selectedItem: AdminEntity | null;
  mode: InspectorMode;
  context: LookupContext;
  onModeChange: (mode: InspectorMode) => void;
  onSelectedIdChange: (itemId: string | null) => void;
  onClose: () => void;
  onDeleted: () => void;
  generateUploadUrl: () => Promise<string>;
  resolveStorageUrl: (args: {
    storageId: Id<"_storage">;
  }) => Promise<string | null>;
};

export type SiteSettingsInspectorProps = {
  revision: number;
  mode: InspectorMode;
  settings: SiteSettingsEntity;
  onModeChange: (mode: InspectorMode) => void;
  onClose: () => void;
  generateUploadUrl: () => Promise<string>;
  resolveStorageUrl: (args: {
    storageId: Id<"_storage">;
  }) => Promise<string | null>;
};

export type ItemInspectorPanelProps = {
  open: boolean;
  title: string;
  description: string;
  children: ReactNode;
};

export type ItemInspectorDrawerProps = {
  open: boolean;
  title: string;
  description: string;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};
