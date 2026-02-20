'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQuery } from 'convex/react';
import type { FunctionReference } from 'convex/server';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Search,
  Upload,
  X,
} from 'lucide-react';
import type { Doc, Id } from '@portfolio/backend/convex/_generated/dataModel';
import { api } from '@portfolio/backend/convex/_generated/api';
import { auth } from '@/lib/auth';
import { useBreakpoint } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Progress } from '@/components/ui/progress';
import { iconRegistryEntries, getRegistryIcon } from '@/data/iconRegistry';

type AdminUser = {
  id: string;
  email: string;
};

type AdminEntity = {
  _id: string;
  order?: number;
  [key: string]: unknown;
};

type SiteSettingsEntity = {
  _id: string;
  siteName?: string;
  tagline?: string;
  logoUrl?: string;
  profileImageUrl?: string;
  resumeUrl?: string;
} | null;

type BootstrapData = {
  siteSettings: SiteSettingsEntity;
  experiences: AdminEntity[];
  projects: AdminEntity[];
  programmingLanguages: AdminEntity[];
  technologies: AdminEntity[];
  cloudProviders: AdminEntity[];
  certificates: AdminEntity[];
  aboutCategories: AdminEntity[];
  aboutItems: AdminEntity[];
};

export type InspectorMode = 'view' | 'edit' | 'create' | 'deleteConfirm';

type EntitySectionId =
  | 'experiences'
  | 'projects'
  | 'languages'
  | 'technologies'
  | 'providers'
  | 'certificates'
  | 'about-categories'
  | 'about-items';

type SectionId = 'site-settings' | EntitySectionId;

type ReorderItem = {
  id: string;
  order: number;
};

type DraftOrder = string[] | null;
type ProjectDraftOrder = DraftOrder;
type ExperienceDraftOrder = DraftOrder;

type TechDraftItem = {
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

type UploadFieldKind = 'image' | 'logo' | 'resumePdf';

type UploadValidationRule = {
  maxBytes: number;
  mimeTypes: string[];
  hint: string;
};

type UploadResult = {
  storageId: string;
  url: string;
  fileName: string;
};

type SelectOption = {
  label: string;
  value: string;
};

type FieldType = 'text' | 'textarea' | 'number' | 'csv' | 'list' | 'select' | 'icon-picker';

type FormFieldConfig = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: SelectOption[];
};

type MediaFieldConfig = {
  key: string;
  label: string;
  kind: UploadFieldKind;
  required?: boolean;
};

export type AdminSectionConfig = {
  id: EntitySectionId;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  fields: FormFieldConfig[];
  mediaFields: MediaFieldConfig[];
  items: AdminEntity[];
  createMutation: FunctionReference<'mutation'>;
  updateMutation: FunctionReference<'mutation'>;
  deleteMutation: FunctionReference<'mutation'>;
};

type LookupContext = {
  aboutCategoryMap: Map<string, AdminEntity>;
  providerMap: Map<string, AdminEntity>;
  certificateCountByProvider: Map<string, number>;
};

const MAX_MB = 1024 * 1024;

const UPLOAD_VALIDATION: Record<UploadFieldKind, UploadValidationRule> = {
  image: {
    maxBytes: 5 * MAX_MB,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    hint: 'PNG, JPG, WEBP, or SVG up to 5MB',
  },
  logo: {
    maxBytes: 3 * MAX_MB,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    hint: 'PNG, JPG, WEBP, or SVG up to 3MB',
  },
  resumePdf: {
    maxBytes: 10 * MAX_MB,
    mimeTypes: ['application/pdf'],
    hint: 'PDF up to 10MB',
  },
};

const TECHNOLOGY_CATEGORY_OPTIONS: SelectOption[] = [
  { label: 'Frontend', value: 'Frontend' },
  { label: 'Backend', value: 'Backend' },
  { label: 'Database', value: 'Database' },
  { label: 'Mobile', value: 'Mobile' },
  { label: 'Testing & QA', value: 'Testing & QA' },
  { label: 'DevOps', value: 'DevOps' },
];

const LANGUAGE_LEVEL_OPTIONS: SelectOption[] = [
  { label: 'Expert', value: 'expert' },
  { label: 'Advanced', value: 'advanced' },
  { label: 'Intermediate', value: 'intermediate' },
];

type ProjectStatus = NonNullable<Doc<'projects'>['status']>;

const PROJECT_STATUS_VALUES = ['new', 'active', 'deprecated'] as const satisfies readonly ProjectStatus[];

const PROJECT_STATUS_OPTIONS: SelectOption[] = PROJECT_STATUS_VALUES.map((status) => ({
  value: status,
  label: status.charAt(0).toUpperCase() + status.slice(1),
}));

const DEFAULT_BOOTSTRAP: BootstrapData = {
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

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

function asId(value: unknown): string {
  return typeof value === 'string' ? value : String(value);
}

function toFormValue(value: unknown, type: FieldType): string {
  if (value === undefined || value === null) {
    return '';
  }

  if (type === 'csv') {
    return Array.isArray(value) ? value.join(', ') : String(value);
  }

  if (type === 'list') {
    return Array.isArray(value) ? value.join('\n') : String(value);
  }

  return String(value);
}

function parseFormValue(raw: string, type: FieldType): unknown {
  if (type === 'number') {
    const parsed = Number(raw || 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (type === 'csv') {
    return raw
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean);
  }

  if (type === 'list') {
    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return raw.trim() === '' ? undefined : raw.trim();
}

function sortByOrder(items: AdminEntity[]): AdminEntity[] {
  return [...items].sort((a, b) => {
    const left = Number(a.order ?? 0);
    const right = Number(b.order ?? 0);
    return left - right;
  });
}

function areSameIdOrder(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

function reconcileDraftOrder(draftIds: DraftOrder, canonicalIds: string[]): DraftOrder {
  if (!draftIds) {
    return null;
  }

  const canonicalSet = new Set(canonicalIds);
  const filtered = draftIds.filter((id) => canonicalSet.has(id));
  const filteredSet = new Set(filtered);

  for (const id of canonicalIds) {
    if (!filteredSet.has(id)) {
      filtered.push(id);
    }
  }

  return filtered;
}

function getNextOrder(items: AdminEntity[]): number {
  if (items.length === 0) {
    return 1;
  }

  return (
    Math.max(
      ...items.map((item) => {
        const value = Number(item.order ?? 0);
        return Number.isFinite(value) ? value : 0;
      }),
    ) + 1
  );
}

function validateUpload(file: File, kind: UploadFieldKind): string | null {
  const rule = UPLOAD_VALIDATION[kind];

  if (!rule.mimeTypes.includes(file.type)) {
    return `Invalid file type. Expected ${rule.hint}.`;
  }

  if (file.size > rule.maxBytes) {
    return `File is too large. Expected ${rule.hint}.`;
  }

  return null;
}

function getSectionItems(sectionId: EntitySectionId, bootstrap: BootstrapData): AdminEntity[] {
  switch (sectionId) {
    case 'experiences':
      return bootstrap.experiences;
    case 'projects':
      return bootstrap.projects;
    case 'languages':
      return bootstrap.programmingLanguages;
    case 'technologies':
      return bootstrap.technologies;
    case 'providers':
      return bootstrap.cloudProviders;
    case 'certificates':
      return bootstrap.certificates;
    case 'about-categories':
      return bootstrap.aboutCategories;
    case 'about-items':
      return bootstrap.aboutItems;
  }
}

function getCardTitle(sectionId: EntitySectionId, item: AdminEntity, context: LookupContext): string {
  if (sectionId === 'experiences') {
    return `${asText(item.company)} · ${asText(item.role)}`;
  }

  if (sectionId === 'projects') {
    return asText(item.title, 'Untitled project');
  }

  if (sectionId === 'languages') {
    return asText(item.name, 'Programming language');
  }

  if (sectionId === 'technologies') {
    return asText(item.name, 'Technology');
  }

  if (sectionId === 'providers') {
    return asText(item.name, 'Cloud provider');
  }

  if (sectionId === 'certificates') {
    return asText(item.name, 'Certificate');
  }

  if (sectionId === 'about-categories') {
    return asText(item.label, 'About category');
  }

  if (sectionId === 'about-items') {
    const category = context.aboutCategoryMap.get(asText(item.categoryId));
    return category ? `${asText(item.title)} · ${asText(category.label)}` : asText(item.title, 'About item');
  }

  return 'Item';
}

function getCardSubtitle(sectionId: EntitySectionId, item: AdminEntity, context: LookupContext): string {
  if (sectionId === 'experiences') {
    return `${asText(item.location)} · ${asText(item.duration)}`;
  }

  if (sectionId === 'projects') {
    return asStringList(item.categories).join(' · ');
  }

  if (sectionId === 'languages') {
    return `Level: ${asText(item.level)}`;
  }

  if (sectionId === 'technologies') {
    return `Category: ${asText(item.category)}`;
  }

  if (sectionId === 'providers') {
    return `${context.certificateCountByProvider.get(asId(item._id)) ?? 0} linked certificates`;
  }

  if (sectionId === 'certificates') {
    const provider = context.providerMap.get(asText(item.providerId));
    return `${provider ? asText(provider.name) : 'Unknown provider'} · ${asText(item.year)}`;
  }

  if (sectionId === 'about-categories') {
    return asText(item.name);
  }

  if (sectionId === 'about-items') {
    return asText(item.subtitle) || asText(item.date);
  }

  return '';
}

function getCardBody(sectionId: EntitySectionId, item: AdminEntity, context: LookupContext): string {
  if (sectionId === 'experiences') {
    return asText(item.description, 'No description yet.');
  }

  if (sectionId === 'projects') {
    return asText(item.description, 'No description yet.');
  }

  if (sectionId === 'languages') {
    return asText(item.description, 'No description yet.');
  }

  if (sectionId === 'technologies') {
    return asText(item.description, `Icon: ${asText(item.iconName, 'n/a')}`);
  }

  if (sectionId === 'providers') {
    return `Display order: ${Number(item.order ?? 0)}`;
  }

  if (sectionId === 'certificates') {
    return asText(item.description, asText(item.issuer, 'No description yet.'));
  }

  if (sectionId === 'about-categories') {
    return `Color: ${asText(item.color)} | Icon: ${asText(item.icon)}`;
  }

  if (sectionId === 'about-items') {
    const category = context.aboutCategoryMap.get(asText(item.categoryId));
    return `${asText(item.description, 'No description yet.')} ${category ? `(Category: ${asText(category.label)})` : ''}`.trim();
  }

  return '';
}

type MediaUploadFieldProps = {
  id: string;
  label: string;
  kind: UploadFieldKind;
  value: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (nextUrl: string, result: UploadResult | null) => void;
  generateUploadUrl: () => Promise<string>;
  resolveStorageUrl: (args: { storageId: Id<'_storage'> }) => Promise<string | null>;
};

function MediaUploadField({
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
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastFileName, setLastFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const rule = UPLOAD_VALIDATION[kind];

  useEffect(() => {
    if (!isUploading) {
      return;
    }

    const interval = window.setInterval(() => {
      setProgress((current) => (current >= 90 ? current : current + 7));
    }, 120);

    return () => window.clearInterval(interval);
  }, [isUploading]);

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateUpload(file, kind);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setIsUploading(true);
      setProgress(12);

      try {
        const uploadUrl = await generateUploadUrl();
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error('Upload failed. Please try again.');
        }

        const payload = (await uploadResponse.json()) as { storageId?: string };
        if (!payload.storageId) {
          throw new Error('Upload failed. Missing storage id.');
        }

        setProgress(96);
        const resolvedUrl = await resolveStorageUrl({
          storageId: payload.storageId as Id<'_storage'>,
        });
        if (!resolvedUrl) {
          throw new Error('Unable to resolve uploaded file URL.');
        }

        setProgress(100);
        setLastFileName(file.name);
        onChange(resolvedUrl, {
          storageId: payload.storageId,
          url: resolvedUrl,
          fileName: file.name,
        });
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.');
      } finally {
        setTimeout(() => {
          setProgress(0);
          setIsUploading(false);
        }, 220);
      }
    },
    [generateUploadUrl, kind, onChange, resolveStorageUrl],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          {label}
          {required ? ' *' : ''}
        </label>
        <span className="text-[11px] text-muted-foreground">{rule.hint}</span>
      </div>

      <div
        className={cn(
          'rounded-xl border bg-background-subtle/30 p-3 transition-colors',
          isDragging ? 'border-primary/70 ring-1 ring-primary/40' : 'border-border/60',
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
          if (file) {
            void uploadFile(file);
          }
        }}
      >
        {kind === 'resumePdf' ? (
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            {value ? (
              <a href={value} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                {lastFileName || 'Open uploaded resume'}
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
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {isUploading ? 'Uploading...' : value ? 'Replace File' : 'Upload File'}
          </Button>

          {value ? (
            <Button
              type="button"
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={() => {
                setError(null);
                setLastFileName(null);
                onChange('', null);
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
            accept={rule.mimeTypes.join(',')}
            disabled={disabled || isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void uploadFile(file);
              }
              event.currentTarget.value = '';
            }}
          />
        </div>

        {isUploading ? (
          <div className="mt-3 space-y-1">
            <Progress value={progress} className="h-1.5" />
            <p className="text-xs text-muted-foreground">Processing upload...</p>
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

type IconPickerFieldProps = {
  label: string;
  value: string;
  required?: boolean;
  onChange: (nextValue: string) => void;
};

function IconPickerField({ label, value, required, onChange }: IconPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return iconRegistryEntries;
    const q = search.toLowerCase();
    return iconRegistryEntries.filter((entry) => entry.key.toLowerCase().includes(q));
  }, [search]);

  const SelectedIcon = getRegistryIcon(value);

  return (
    <div className="space-y-2">
      <span className="mb-2 block text-xs font-mono text-muted-foreground uppercase tracking-wider">
        {label}
        {required ? ' *' : ''}
      </span>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => { setOpen(true); setSearch(''); }}
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
            onClick={() => onChange('')}
          >
            Clear
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div
            className="mx-4 w-full max-w-lg rounded-2xl border border-border bg-background shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search icons…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              <span className="text-xs text-muted-foreground tabular-nums">{filtered.length} icons</span>
              <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
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
                      'flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors',
                      isActive
                        ? 'bg-primary/15 border border-primary/30'
                        : 'hover:bg-primary/[0.06] border border-transparent',
                    )}
                  >
                    <Icon className="h-5 w-5 text-foreground" />
                    <span className="text-[8px] leading-tight text-muted-foreground truncate w-full text-center">
                      {entry.key.replace(/^(Si|Fa)/, '')}
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
          </div>
        </div>
      )}
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
  onCreate: () => void;
};

function EmptyState({ title, description, onCreate }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-background-subtle/30 p-8 text-center">
      <p className="font-display text-2xl text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{description}</p>
      <Button className="mt-5" onClick={onCreate}>
        <Plus className="mr-2 h-4 w-4" />
        Create Item
      </Button>
    </div>
  );
}

type SectionCardProps = {
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

const SectionCard = memo(
  function SectionCard({
    sectionId,
    item,
    context,
    isSelected,
    orderLabel,
    dragHandle,
    onOpen,
    onEdit,
    onDelete,
  }: SectionCardProps) {
    const itemId = asId(item._id);
    const category = context.aboutCategoryMap.get(asText(item.categoryId));
    const provider = context.providerMap.get(asText(item.providerId));

    return (
      <div
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        onClick={() => onOpen(itemId)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpen(itemId);
          }
        }}
        className={cn(
          'group w-full rounded-2xl border p-4 text-left transition-all duration-300',
          isSelected
            ? 'border-primary/60 bg-primary/5 shadow-lg shadow-primary/10'
            : 'border-border/60 bg-background-subtle/30 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-background-subtle/60',
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg leading-tight text-foreground">{getCardTitle(sectionId, item, context)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{getCardSubtitle(sectionId, item, context)}</p>
          </div>

          <div className="flex items-center gap-2">
            {orderLabel ? (
              <Badge variant="outline" className="font-mono text-[10px]">
                #{orderLabel}
              </Badge>
            ) : null}
            {dragHandle}
            <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(itemId);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 border-destructive/60 text-destructive hover:bg-destructive/10"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(itemId);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {sectionId === 'projects' || sectionId === 'certificates' || sectionId === 'about-items' ? (
          asText(item.image) ? (
            <div className="relative mb-3 h-28 w-full overflow-hidden rounded-lg border border-border/50">
              <Image
                src={asText(item.image)}
                alt={getCardTitle(sectionId, item, context)}
                fill
                sizes="(max-width: 1280px) 100vw, 420px"
                className="object-cover"
              />
            </div>
          ) : null
        ) : null}

        {sectionId === 'experiences' && asText(item.logo) ? (
          <Image
            src={asText(item.logo)}
            alt={`${asText(item.company)} logo`}
            width={56}
            height={56}
            sizes="56px"
            className="mb-3 h-14 w-14 rounded-lg border border-border/50 bg-background p-2 object-contain"
          />
        ) : null}

        {sectionId === 'languages' && asText(item.logoUrl) ? (
          <Image
            src={asText(item.logoUrl)}
            alt={`${asText(item.name)} logo`}
            width={56}
            height={56}
            sizes="56px"
            className="mb-3 h-14 w-14 rounded-lg border border-border/50 bg-background p-2 object-contain"
          />
        ) : null}

        <p className="line-clamp-3 text-sm text-muted-foreground">{getCardBody(sectionId, item, context)}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {sectionId === 'experiences' && item.isCurrent === true ? <Badge variant="outline">Current role</Badge> : null}
          {sectionId === 'technologies' ? <Badge variant="outline">{asText(item.category)}</Badge> : null}
          {sectionId === 'languages' ? <Badge variant="outline">{asText(item.level)}</Badge> : null}
          {sectionId === 'providers' ? (
            <Badge variant="outline">{context.certificateCountByProvider.get(itemId) ?? 0} certificates</Badge>
          ) : null}
          {sectionId === 'about-categories' ? (
            <Badge variant="outline" className="gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: asText(item.color, '#999') }} />
              {asText(item.icon)}
            </Badge>
          ) : null}
          {sectionId === 'about-items' && category ? <Badge variant="outline">{asText(category.label)}</Badge> : null}
          {sectionId === 'certificates' && provider ? <Badge variant="outline">{asText(provider.name)}</Badge> : null}
        </div>
      </div>
    );
  },
  (prev, next) =>
    prev.sectionId === next.sectionId &&
    prev.item === next.item &&
    prev.context === next.context &&
    prev.isSelected === next.isSelected &&
    prev.orderLabel === next.orderLabel,
);

type SectionCardGridProps = {
  config: AdminSectionConfig;
  items: AdminEntity[];
  selectedItemId: string | null;
  context: LookupContext;
  onCreate: () => void;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

function SectionCardGrid({
  config,
  items,
  selectedItemId,
  context,
  onCreate,
  onOpen,
  onEdit,
  onDelete,
}: SectionCardGridProps) {
  if (items.length === 0) {
    return <EmptyState title={config.emptyTitle} description={config.emptyDescription} onCreate={onCreate} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {items.map((item) => (
        <SectionCard
          key={asId(item._id)}
          sectionId={config.id}
          item={item}
          context={context}
          isSelected={selectedItemId === asId(item._id)}
          onOpen={onOpen}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

type ProjectOrderToolbarProps = {
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
};

function ProjectOrderToolbar({ hasChanges, isSaving, onSave, onReset }: ProjectOrderToolbarProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background-subtle/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Project order</p>
          <p className="text-xs text-muted-foreground">
            Drag cards by the handle to reorder. Save when you are ready to publish this order.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasChanges ? <Badge variant="outline">Unsaved order changes</Badge> : null}
          <Button type="button" variant="outline" onClick={onReset} disabled={isSaving || !hasChanges}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button type="button" onClick={onSave} disabled={isSaving || !hasChanges}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Saving order...' : 'Save Order'}
          </Button>
        </div>
      </div>
    </div>
  );
}

type ExperienceCurrentRoleOption = {
  id: string;
  label: string;
};

type ExperienceLayoutToolbarProps = {
  hasChanges: boolean;
  isSaving: boolean;
  currentRoleId: string | null;
  currentRoleOptions: ExperienceCurrentRoleOption[];
  onCurrentRoleChange: (nextCurrentRoleId: string | null) => void;
  onSave: () => void;
  onReset: () => void;
};

function ExperienceLayoutToolbar({
  hasChanges,
  isSaving,
  currentRoleId,
  currentRoleOptions,
  onCurrentRoleChange,
  onSave,
  onReset,
}: ExperienceLayoutToolbarProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-background-subtle/30 p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Experience layout</p>
        <p className="text-xs text-muted-foreground">
          Drag cards by the handle to reorder and set which role is marked as current.
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="min-w-64 flex-1">
          <span className="mb-2 block text-xs font-mono uppercase tracking-wider text-muted-foreground">Current role</span>
          <select
            className="w-full rounded-lg border border-border/60 bg-background-subtle/30 px-3 py-2 text-sm"
            value={currentRoleId ?? ''}
            onChange={(event) => {
              const nextValue = event.target.value.trim();
              onCurrentRoleChange(nextValue === '' ? null : nextValue);
            }}
            disabled={isSaving}
          >
            <option value="">None</option>
            {currentRoleOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          {hasChanges ? <Badge variant="outline">Unsaved experience changes</Badge> : null}
          <Button type="button" variant="outline" onClick={onReset} disabled={isSaving || !hasChanges}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button type="button" onClick={onSave} disabled={isSaving || !hasChanges}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Saving layout...' : 'Save Layout'}
          </Button>
        </div>
      </div>
    </div>
  );
}

type TechBatchToolbarProps = {
  hasChanges: boolean;
  isSaving: boolean;
  onAdd: () => void;
  onSave: () => void;
  onCancel: () => void;
};

function TechBatchToolbar({ hasChanges, isSaving, onAdd, onSave, onCancel }: TechBatchToolbarProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background-subtle/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Technologies</p>
          <p className="text-xs text-muted-foreground">
            Edit inline, add or remove items, then save all changes at once.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasChanges ? <Badge variant="outline">Unsaved changes</Badge> : null}
          <Button type="button" variant="outline" size="sm" onClick={onAdd} disabled={isSaving}>
            <Plus className="mr-2 h-4 w-4" />
            Add Technology
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isSaving || !hasChanges}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={onSave} disabled={isSaving || !hasChanges}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save All'}
          </Button>
        </div>
      </div>
    </div>
  );
}

type TechEditableCardProps = {
  item: TechDraftItem;
  onFieldChange: (id: string, field: keyof TechDraftItem, value: string | number) => void;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string) => void;
  generateUploadUrl: () => Promise<string>;
  resolveStorageUrl: (args: { storageId: Id<'_storage'> }) => Promise<string | null>;
};

function TechEditableCard({
  item,
  onFieldChange,
  onToggleExpand,
  onDelete,
  generateUploadUrl,
  resolveStorageUrl,
}: TechEditableCardProps) {
  const SelectedIcon = getRegistryIcon(item.iconName);

  if (item._isExpanded) {
    return (
      <div className="rounded-2xl border border-primary/40 bg-background-subtle/50 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {item._isNew ? (
              <Badge variant="outline" className="text-xs">New</Badge>
            ) : null}
            <span className="font-display text-sm text-foreground">{item.name || 'New Technology'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(item._id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onToggleExpand(item._id)}>
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">Name *</span>
            <input
              type="text"
              className="w-full rounded-lg border border-border/60 bg-background-subtle/30 px-3 py-2 text-sm"
              value={item.name}
              onChange={(e) => onFieldChange(item._id, 'name', e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">Category *</span>
            <select
              className="w-full rounded-lg border border-border/60 bg-background-subtle/30 px-3 py-2 text-sm"
              value={item.category}
              onChange={(e) => onFieldChange(item._id, 'category', e.target.value)}
            >
              <option value="">Select category</option>
              {TECHNOLOGY_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block space-y-1">
          <span className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">Description</span>
          <textarea
            className="w-full rounded-lg border border-border/60 bg-background-subtle/30 px-3 py-2 text-sm"
            rows={2}
            value={item.description}
            onChange={(e) => onFieldChange(item._id, 'description', e.target.value)}
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <IconPickerField
            label="Icon"
            value={item.iconName}
            onChange={(v) => onFieldChange(item._id, 'iconName', v)}
          />
          <label className="space-y-1">
            <span className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">Display Order *</span>
            <input
              type="number"
              className="w-full rounded-lg border border-border/60 bg-background-subtle/30 px-3 py-2 text-sm"
              value={item.order}
              onChange={(e) => onFieldChange(item._id, 'order', Number(e.target.value) || 0)}
            />
          </label>
        </div>

        <MediaUploadField
          id={`tech-icon-${item._id}`}
          label="Custom Icon Image"
          kind="logo"
          value={item.iconUrl}
          onChange={(url) => onFieldChange(item._id, 'iconUrl', url)}
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
        onClick={() => onToggleExpand(item._id)}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-background text-foreground">
          {SelectedIcon ? <SelectedIcon className="h-5 w-5" /> : <span className="text-xs font-mono">{item.order}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{item.name || 'Untitled'}</p>
          <p className="truncate text-xs text-muted-foreground">{item.category || 'No category'}</p>
        </div>
        {item._isNew ? <Badge variant="outline" className="text-xs">New</Badge> : null}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
      <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(item._id)}>
        <Trash2 className="h-4 w-4 text-destructive/60 group-hover:text-destructive" />
      </Button>
    </div>
  );
}

type SortableProjectCardProps = {
  item: AdminEntity;
  position: number;
  context: LookupContext;
  isSelected: boolean;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

function SortableProjectCard({
  item,
  position,
  context,
  isSelected,
  onOpen,
  onEdit,
  onDelete,
}: SortableProjectCardProps) {
  const itemId = asId(item._id);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: itemId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('touch-manipulation', isDragging ? 'z-20 opacity-80' : undefined)}
    >
      <SectionCard
        sectionId="projects"
        item={item}
        context={context}
        isSelected={isSelected}
        orderLabel={String(position)}
        dragHandle={
          <button
            ref={setActivatorNodeRef}
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            aria-label={`Reorder ${asText(item.title, 'project')}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        }
        onOpen={onOpen}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

type SortableProjectGridProps = {
  items: AdminEntity[];
  selectedItemId: string | null;
  context: LookupContext;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (nextIds: string[]) => void;
};

function SortableProjectGrid({
  items,
  selectedItemId,
  context,
  onOpen,
  onEdit,
  onDelete,
  onReorder,
}: SortableProjectGridProps) {
  const ids = useMemo(() => items.map((item) => asId(item._id)), [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));

      if (oldIndex < 0 || newIndex < 0) {
        return;
      }

      onReorder(arrayMove(ids, oldIndex, newIndex));
    },
    [ids, onReorder],
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((item, index) => (
            <SortableProjectCard
              key={asId(item._id)}
              item={item}
              position={index + 1}
              context={context}
              isSelected={selectedItemId === asId(item._id)}
              onOpen={onOpen}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

type SortableExperienceCardProps = {
  item: AdminEntity;
  position: number;
  context: LookupContext;
  isSelected: boolean;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

function SortableExperienceCard({
  item,
  position,
  context,
  isSelected,
  onOpen,
  onEdit,
  onDelete,
}: SortableExperienceCardProps) {
  const itemId = asId(item._id);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: itemId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('touch-manipulation', isDragging ? 'z-20 opacity-80' : undefined)}
    >
      <SectionCard
        sectionId="experiences"
        item={item}
        context={context}
        isSelected={isSelected}
        orderLabel={String(position)}
        dragHandle={
          <button
            ref={setActivatorNodeRef}
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            aria-label={`Reorder ${asText(item.role, 'experience')}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        }
        onOpen={onOpen}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

type SortableExperienceGridProps = {
  items: AdminEntity[];
  selectedItemId: string | null;
  context: LookupContext;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (nextIds: string[]) => void;
};

function SortableExperienceGrid({
  items,
  selectedItemId,
  context,
  onOpen,
  onEdit,
  onDelete,
  onReorder,
}: SortableExperienceGridProps) {
  const ids = useMemo(() => items.map((item) => asId(item._id)), [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));

      if (oldIndex < 0 || newIndex < 0) {
        return;
      }

      onReorder(arrayMove(ids, oldIndex, newIndex));
    },
    [ids, onReorder],
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((item, index) => (
            <SortableExperienceCard
              key={asId(item._id)}
              item={item}
              position={index + 1}
              context={context}
              isSelected={selectedItemId === asId(item._id)}
              onOpen={onOpen}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

type EntityInspectorProps = {
  config: AdminSectionConfig;
  selectedItem: AdminEntity | null;
  mode: InspectorMode;
  context: LookupContext;
  onModeChange: (mode: InspectorMode) => void;
  onSelectedIdChange: (itemId: string | null) => void;
  onClose: () => void;
  onDeleted: () => void;
  generateUploadUrl: () => Promise<string>;
  resolveStorageUrl: (args: { storageId: Id<'_storage'> }) => Promise<string | null>;
};

function EntityInspector({
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

  const [form, setForm] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextOrder = useMemo(() => getNextOrder(config.items), [config.items]);

  useEffect(() => {
    const nextForm: Record<string, string> = {};
    const source = mode === 'edit' ? selectedItem : null;

    for (const field of config.fields) {
      if (!source && field.key === 'order' && mode === 'create') {
        nextForm[field.key] = String(nextOrder);
      } else {
        nextForm[field.key] = toFormValue(source?.[field.key], field.type);
      }
    }

    for (const mediaField of config.mediaFields) {
      nextForm[mediaField.key] = asText(source?.[mediaField.key]);
    }

    setForm(nextForm);
    setError(null);
  }, [mode, nextOrder, selectedItem, config.fields, config.mediaFields]);

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSaving(true);
      setError(null);

      try {
        const payload: Record<string, unknown> = {};

        for (const field of config.fields) {
          const raw = form[field.key] ?? '';
          if (field.required && field.type !== 'number' && raw.trim() === '') {
            throw new Error(`${field.label} is required.`);
          }
          if (field.type === 'select') {
            const selected = raw.trim();
            const allowedValues = (field.options ?? []).map((option) => option.value);
            if (selected !== '' && !allowedValues.includes(selected)) {
              throw new Error(`${field.label} must be one of: ${allowedValues.join(', ')}`);
            }
          }
          payload[field.key] = parseFormValue(raw, field.type);
        }

        for (const mediaField of config.mediaFields) {
          const mediaValue = (form[mediaField.key] ?? '').trim();
          if (mediaField.required && mediaValue === '') {
            throw new Error(`${mediaField.label} is required.`);
          }
          payload[mediaField.key] = mediaValue === '' ? undefined : mediaValue;
        }

        if (mode === 'edit' && selectedItem) {
          await update({ id: asId(selectedItem._id), ...payload } as never);
          onModeChange('view');
          return;
        }

        const createdId = await create(payload as never);
        onSelectedIdChange(asId(createdId));
        onModeChange('view');
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Failed to save item.');
      } finally {
        setIsSaving(false);
      }
    },
    [config.fields, config.mediaFields, create, form, mode, onModeChange, onSelectedIdChange, selectedItem, update],
  );

  if (mode === 'deleteConfirm' && selectedItem) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-display text-xl">Delete Item</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          This action cannot be undone. The selected {config.title.toLowerCase()} item will be permanently removed.
        </p>

        <div className="rounded-lg border border-border/60 bg-background-subtle/40 p-3">
          <p className="font-medium text-foreground">{getCardTitle(config.id, selectedItem, context)}</p>
          <p className="mt-1 text-xs font-mono text-muted-foreground">id: {asId(selectedItem._id)}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={async () => {
              setError(null);
              setIsDeleting(true);

              try {
                await remove({ id: asId(selectedItem._id) } as never);
                onDeleted();
              } catch (deleteError) {
                setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete item.');
              } finally {
                setIsDeleting(false);
              }
            }}
          >
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
          <Button variant="outline" onClick={() => onModeChange('view')}>
            Cancel
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    );
  }

  if (mode === 'create' || (mode === 'edit' && selectedItem)) {
    const singularTitle = config.title.endsWith('s') ? config.title.slice(0, -1) : config.title;

    return (
      <form className="space-y-4" onSubmit={submit}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl text-foreground">
              {mode === 'create' ? `Create ${singularTitle}` : `Edit ${singularTitle}`}
            </h3>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-3">
          {config.fields.map((field) => (
            field.type === 'icon-picker' ? (
              <IconPickerField
                key={field.key}
                label={field.label}
                value={form[field.key] ?? ''}
                required={field.required}
                onChange={(nextValue) => setForm((current) => ({ ...current, [field.key]: nextValue }))}
              />
            ) : (
            <label key={field.key}>
              <span className="mb-2 block text-xs font-mono text-muted-foreground uppercase tracking-wider">
                {field.label}
                {field.required ? ' *' : ''}
              </span>

              {field.type === 'textarea' || field.type === 'list' ? (
                <textarea
                  className="min-h-24 w-full rounded-lg border border-border/60 bg-background-subtle/30 px-3 py-2"
                  value={form[field.key] ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                  placeholder={field.type === 'list' ? 'One line per value' : field.label}
                  required={field.required}
                />
              ) : field.type === 'select' ? (
                <select
                  className="w-full rounded-lg border border-border/60 bg-background-subtle/30 px-3 py-2"
                  value={form[field.key] ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                  required={field.required}
                >
                  <option value="">Select {field.label}</option>
                  {(field.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  className="w-full rounded-lg border border-border/60 bg-background-subtle/30 px-3 py-2"
                  value={form[field.key] ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                  required={field.required}
                />
              )}
            </label>
            )
          ))}

          {config.mediaFields.map((mediaField) => (
            <MediaUploadField
              key={mediaField.key}
              id={`${config.id}-${mediaField.key}`}
              label={mediaField.label}
              kind={mediaField.kind}
              value={form[mediaField.key] ?? ''}
              required={mediaField.required}
              disabled={isSaving}
              generateUploadUrl={generateUploadUrl}
              resolveStorageUrl={resolveStorageUrl}
              onChange={(nextUrl) => {
                setForm((current) => ({ ...current, [mediaField.key]: nextUrl }));
              }}
            />
          ))}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : mode === 'create' ? 'Create Item' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => onModeChange('view')}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  if (selectedItem) {
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl text-foreground">{getCardTitle(config.id, selectedItem, context)}</h3>
            <p className="text-sm text-muted-foreground">{getCardSubtitle(config.id, selectedItem, context)}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {config.id === 'projects' || config.id === 'certificates' || config.id === 'about-items' ? (
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

        {config.id === 'experiences' && asText(selectedItem.logo) ? (
          <Image
            src={asText(selectedItem.logo)}
            alt={`${asText(selectedItem.company)} logo`}
            width={80}
            height={80}
            sizes="80px"
            className="h-20 w-20 rounded-lg border border-border/60 bg-background p-2 object-contain"
          />
        ) : null}

        {config.id === 'languages' && asText(selectedItem.logoUrl) ? (
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
          <p className="text-sm text-muted-foreground">{getCardBody(config.id, selectedItem, context)}</p>

          {config.id === 'projects' ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {asStringList(selectedItem.techStack).map((tech) => (
                <Badge key={tech} variant="outline">
                  {tech}
                </Badge>
              ))}
            </div>
          ) : null}

          {config.id === 'experiences' ? (
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
          <Button onClick={() => onModeChange('edit')}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => onModeChange('deleteConfirm')}>
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
      <p className="mt-2 text-sm text-muted-foreground">Click any card to view details, or create a new item.</p>
      <Button className="mt-4" onClick={() => onModeChange('create')}>
        <Plus className="mr-2 h-4 w-4" />
        Create Item
      </Button>
    </div>
  );
}

type SiteSettingsInspectorProps = {
  mode: InspectorMode;
  settings: SiteSettingsEntity;
  onModeChange: (mode: InspectorMode) => void;
  onClose: () => void;
  generateUploadUrl: () => Promise<string>;
  resolveStorageUrl: (args: { storageId: Id<'_storage'> }) => Promise<string | null>;
};

function SiteSettingsInspector({
  mode,
  settings,
  onModeChange,
  onClose,
  generateUploadUrl,
  resolveStorageUrl,
}: SiteSettingsInspectorProps) {
  const upsert = useMutation(api.admin.upsertSiteSettings);

  const [form, setForm] = useState({
    siteName: '',
    tagline: '',
    logoUrl: '',
    profileImageUrl: '',
    resumeUrl: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      siteName: asText(settings?.siteName),
      tagline: asText(settings?.tagline),
      logoUrl: asText(settings?.logoUrl),
      profileImageUrl: asText(settings?.profileImageUrl),
      resumeUrl: asText(settings?.resumeUrl),
    });
    setError(null);
  }, [settings]);

  if (mode === 'edit' || mode === 'create') {
    return (
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setIsSaving(true);
          setError(null);

          try {
            await upsert({
              siteName: form.siteName.trim() || undefined,
              tagline: form.tagline.trim() || undefined,
              logoUrl: form.logoUrl.trim() || undefined,
              profileImageUrl: form.profileImageUrl.trim() || undefined,
              resumeUrl: form.resumeUrl.trim() || undefined,
            });
            onModeChange('view');
          } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Failed to save site settings.');
          } finally {
            setIsSaving(false);
          }
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl text-foreground">
              {mode === 'create' ? 'Create Site Settings' : 'Edit Site Settings'}
            </h3>
            <p className="text-sm text-muted-foreground">Control branding and hero defaults for the public site.</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <label>
          <span className="mb-2 block text-xs font-mono text-muted-foreground uppercase tracking-wider">Site Name</span>
          <input
            className="w-full rounded-lg border border-border/60 bg-background-subtle/30 px-3 py-2"
            value={form.siteName}
            onChange={(event) => setForm((current) => ({ ...current, siteName: event.target.value }))}
          />
        </label>

        <label>
          <span className="mb-2 block text-xs font-mono text-muted-foreground uppercase tracking-wider">Tagline</span>
          <textarea
            className="min-h-20 w-full rounded-lg border border-border/60 bg-background-subtle/30 px-3 py-2"
            value={form.tagline}
            onChange={(event) => setForm((current) => ({ ...current, tagline: event.target.value }))}
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
          onChange={(nextUrl) => setForm((current) => ({ ...current, logoUrl: nextUrl }))}
        />

        <MediaUploadField
          id="site-settings-profile"
          label="Profile Image"
          kind="image"
          value={form.profileImageUrl}
          generateUploadUrl={generateUploadUrl}
          resolveStorageUrl={resolveStorageUrl}
          disabled={isSaving}
          onChange={(nextUrl) => setForm((current) => ({ ...current, profileImageUrl: nextUrl }))}
        />

        <MediaUploadField
          id="site-settings-resume"
          label="Resume PDF"
          kind="resumePdf"
          value={form.resumeUrl}
          generateUploadUrl={generateUploadUrl}
          resolveStorageUrl={resolveStorageUrl}
          disabled={isSaving}
          onChange={(nextUrl) => setForm((current) => ({ ...current, resumeUrl: nextUrl }))}
        />

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
          <Button type="button" variant="outline" onClick={() => onModeChange('view')}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  if (!settings) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 p-6 text-center">
        <p className="font-display text-xl text-foreground">No Site Settings Yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Create the singleton settings record to control branding and hero assets.
        </p>
        <Button className="mt-4" onClick={() => onModeChange('create')}>
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
          <h3 className="font-display text-xl text-foreground">{asText(settings.siteName, 'Portfolio Settings')}</h3>
          <p className="text-sm text-muted-foreground">{asText(settings.tagline, 'No tagline configured yet.')}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border/60 bg-background-subtle/40 p-3">
          <p className="mb-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">Logo</p>
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
          <p className="mb-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">Profile Image</p>
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
            <p className="text-sm text-muted-foreground">No profile image uploaded</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-background-subtle/40 p-3">
        <p className="mb-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">Resume</p>
        {settings.resumeUrl ? (
          <a href={settings.resumeUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline-offset-4 hover:underline">
            Open uploaded resume
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">No resume uploaded</p>
        )}
      </div>

      <Button onClick={() => onModeChange('edit')}>
        <Pencil className="mr-2 h-4 w-4" />
        Edit Settings
      </Button>
    </div>
  );
}

type ItemInspectorPanelProps = {
  open: boolean;
  title: string;
  description: string;
  children: ReactNode;
};

function ItemInspectorPanel({ open, title, description, children }: ItemInspectorPanelProps) {
  return (
    <aside className="hidden xl:block">
      <div className="sticky top-24">
        <div className="max-h-[calc(100vh-7.5rem)] overflow-y-auto rounded-2xl border border-border/60 bg-background-subtle/20 p-5">
          {open ? (
            children
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 p-6 text-center">
              <p className="font-display text-xl text-foreground">{title} Inspector Closed</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {description || 'Select a card or click create to open this section inspector.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

type ItemInspectorDrawerProps = {
  open: boolean;
  title: string;
  description: string;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

function ItemInspectorDrawer({ open, title, description, onOpenChange, children }: ItemInspectorDrawerProps) {
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

type AdminWorkspaceShellProps = {
  user: AdminUser;
  tabs: Array<{ id: SectionId; label: string }>;
  activeSectionId: SectionId;
  onSectionChange: (id: SectionId) => void;
  sectionTitle: string;
  sectionDescription: string;
  onCreateOrEditSettings: () => void;
  onCreateItem: () => void;
  isSiteSettingsSection: boolean;
  hasSiteSettings: boolean;
  cardList: ReactNode;
  inspector: ReactNode;
  inspectorOpen: boolean;
};

function AdminWorkspaceShell({
  user,
  tabs,
  activeSectionId,
  onSectionChange,
  sectionTitle,
  sectionDescription,
  onCreateOrEditSettings,
  onCreateItem,
  isSiteSettingsSection,
  hasSiteSettings,
  cardList,
  inspector,
  inspectorOpen,
}: AdminWorkspaceShellProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary/80">Admin</p>
            <h1 className="font-display text-3xl">Portfolio Control Center</h1>
            <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
          </div>
          <Button
            variant="outline"
            className="border-border/60 hover:border-primary/50"
            onClick={async () => {
              await auth.client.logout();
              router.push('/admin/login');
              router.refresh();
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <div className="container mx-auto grid grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[260px_1fr]">
        <aside className="card-luxe h-fit p-3">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={cn(
                  'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  activeSectionId === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-background-subtle/70 hover:text-foreground',
                )}
                onClick={() => onSectionChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="space-y-5">
          <section className="card-luxe p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl text-foreground">{sectionTitle}</h2>
                <p className="max-w-2xl text-sm text-muted-foreground">{sectionDescription}</p>
              </div>

              {isSiteSettingsSection ? (
                <Button onClick={onCreateOrEditSettings}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {hasSiteSettings ? 'Edit Settings' : 'Create Settings'}
                </Button>
              ) : (
                <Button onClick={onCreateItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Item
                </Button>
              )}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <section className="space-y-4">{cardList}</section>
            <ItemInspectorPanel open={inspectorOpen} title={sectionTitle} description={sectionDescription}>
              {inspector}
            </ItemInspectorPanel>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard({ user }: { user: AdminUser }) {
  const { isDesktop } = useBreakpoint();
  const { toast } = useToast();

  const bootstrap = useQuery(api.admin.getAdminBootstrap) as BootstrapData | undefined;
  const generateUploadUrl = useMutation(api.admin.generateUploadUrl);
  const resolveStorageUrl = useMutation(api.admin.resolveStorageUrl);
  const reorderExperiences = useMutation(api.admin.reorderExperiences);
  const reorderProjects = useMutation(api.admin.reorderProjects);

  const [activeSectionId, setActiveSectionId] = useState<SectionId>('site-settings');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<InspectorMode>('view');
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [experienceDraftOrderIds, setExperienceDraftOrderIds] = useState<ExperienceDraftOrder>(null);
  const [experienceDraftCurrentRoleId, setExperienceDraftCurrentRoleId] = useState<string | null | undefined>(
    undefined,
  );
  const [isSavingExperienceLayout, setIsSavingExperienceLayout] = useState(false);
  const [projectDraftOrderIds, setProjectDraftOrderIds] = useState<ProjectDraftOrder>(null);
  const [isSavingProjectOrder, setIsSavingProjectOrder] = useState(false);
  const [techDraftItems, setTechDraftItems] = useState<TechDraftItem[] | null>(null);
  const [isSavingTechBatch, setIsSavingTechBatch] = useState(false);
  const batchSaveTechnologies = useMutation(api.admin.batchSaveTechnologies);

  useEffect(() => {
    setSelectedItemId(null);
    setPanelMode('view');
    setMobileInspectorOpen(false);
  }, [activeSectionId]);

  useEffect(() => {
    if (isDesktop) {
      setMobileInspectorOpen(false);
    }
  }, [isDesktop]);

  const data = bootstrap ?? DEFAULT_BOOTSTRAP;
  const sortedExperiences = useMemo(() => sortByOrder(data.experiences), [data.experiences]);
  const canonicalExperienceOrderIds = useMemo(
    () => sortedExperiences.map((item) => asId(item._id)),
    [sortedExperiences],
  );
  const experiencesById = useMemo(
    () => new Map(sortedExperiences.map((item) => [asId(item._id), item])),
    [sortedExperiences],
  );
  const canonicalCurrentExperienceId = useMemo(() => {
    for (const item of sortedExperiences) {
      if (item.isCurrent === true) {
        return asId(item._id);
      }
    }
    return null;
  }, [sortedExperiences]);

  const sortedProjects = useMemo(() => sortByOrder(data.projects), [data.projects]);
  const canonicalProjectOrderIds = useMemo(
    () => sortedProjects.map((item) => asId(item._id)),
    [sortedProjects],
  );
  const projectsById = useMemo(
    () => new Map(sortedProjects.map((item) => [asId(item._id), item])),
    [sortedProjects],
  );

  useEffect(() => {
    setExperienceDraftOrderIds((current) => {
      const reconciled = reconcileDraftOrder(current, canonicalExperienceOrderIds);
      if (reconciled === null) {
        return null;
      }
      if (current && areSameIdOrder(current, reconciled)) {
        return current;
      }
      return areSameIdOrder(reconciled, canonicalExperienceOrderIds) ? null : reconciled;
    });
  }, [canonicalExperienceOrderIds]);

  useEffect(() => {
    setExperienceDraftCurrentRoleId((current) => {
      if (current === undefined) {
        return undefined;
      }
      if (current === canonicalCurrentExperienceId) {
        return undefined;
      }
      if (current !== null && !experiencesById.has(current)) {
        return undefined;
      }
      return current;
    });
  }, [canonicalCurrentExperienceId, experiencesById]);

  useEffect(() => {
    setProjectDraftOrderIds((current) => {
      const reconciled = reconcileDraftOrder(current, canonicalProjectOrderIds);
      if (reconciled === null) {
        return null;
      }
      if (current && areSameIdOrder(current, reconciled)) {
        return current;
      }
      return areSameIdOrder(reconciled, canonicalProjectOrderIds) ? null : reconciled;
    });
  }, [canonicalProjectOrderIds]);

  const hasExperienceOrderChanges = useMemo(() => {
    if (!experienceDraftOrderIds) {
      return false;
    }
    return !areSameIdOrder(experienceDraftOrderIds, canonicalExperienceOrderIds);
  }, [experienceDraftOrderIds, canonicalExperienceOrderIds]);

  const hasExperienceCurrentRoleChanges = useMemo(() => {
    return (
      experienceDraftCurrentRoleId !== undefined &&
      experienceDraftCurrentRoleId !== canonicalCurrentExperienceId
    );
  }, [experienceDraftCurrentRoleId, canonicalCurrentExperienceId]);

  const hasExperienceChanges = hasExperienceOrderChanges || hasExperienceCurrentRoleChanges;

  const effectiveCurrentExperienceId = useMemo(
    () =>
      experienceDraftCurrentRoleId === undefined
        ? canonicalCurrentExperienceId
        : experienceDraftCurrentRoleId,
    [experienceDraftCurrentRoleId, canonicalCurrentExperienceId],
  );

  const effectiveExperienceItems = useMemo(() => {
    if (!experienceDraftOrderIds || experienceDraftOrderIds.length === 0) {
      return sortedExperiences;
    }

    const ordered = experienceDraftOrderIds
      .map((id) => experiencesById.get(id))
      .filter((item): item is AdminEntity => Boolean(item));

    if (ordered.length !== sortedExperiences.length) {
      const orderedIdSet = new Set(ordered.map((item) => asId(item._id)));
      for (const item of sortedExperiences) {
        const id = asId(item._id);
        if (!orderedIdSet.has(id)) {
          ordered.push(item);
        }
      }
    }

    return ordered;
  }, [experienceDraftOrderIds, experiencesById, sortedExperiences]);

  const hasProjectOrderChanges = useMemo(() => {
    if (!projectDraftOrderIds) {
      return false;
    }
    return !areSameIdOrder(projectDraftOrderIds, canonicalProjectOrderIds);
  }, [projectDraftOrderIds, canonicalProjectOrderIds]);

  const effectiveProjectItems = useMemo(() => {
    if (!projectDraftOrderIds || projectDraftOrderIds.length === 0) {
      return sortedProjects;
    }

    const ordered = projectDraftOrderIds
      .map((id) => projectsById.get(id))
      .filter((item): item is AdminEntity => Boolean(item));

    if (ordered.length !== sortedProjects.length) {
      const orderedIdSet = new Set(ordered.map((item) => asId(item._id)));
      for (const item of sortedProjects) {
        const id = asId(item._id);
        if (!orderedIdSet.has(id)) {
          ordered.push(item);
        }
      }
    }

    return ordered;
  }, [projectDraftOrderIds, projectsById, sortedProjects]);

  const sortedTechnologies = useMemo(() => sortByOrder(data.technologies), [data.technologies]);

  const canonicalTechItems = useMemo<TechDraftItem[]>(
    () =>
      sortedTechnologies.map((item) => ({
        _id: asId(item._id),
        name: asText(item.name),
        category: asText(item.category),
        description: asText(item.description),
        iconName: asText(item.iconName),
        iconUrl: asText(item.iconUrl),
        order: Number(item.order ?? 0),
      })),
    [sortedTechnologies],
  );

  const effectiveTechItems = useMemo(
    () => (techDraftItems ?? canonicalTechItems).filter((item) => !item._isDeleted),
    [techDraftItems, canonicalTechItems],
  );

  const hasTechChanges = useMemo(() => {
    if (!techDraftItems) return false;
    const canonical = canonicalTechItems;
    const draft = techDraftItems;
    if (draft.some((item) => item._isNew || item._isDeleted)) return true;
    const canonicalMap = new Map(canonical.map((item) => [item._id, item]));
    for (const item of draft) {
      if (item._isNew || item._isDeleted) continue;
      const orig = canonicalMap.get(item._id);
      if (!orig) return true;
      if (
        item.name !== orig.name ||
        item.category !== orig.category ||
        item.description !== orig.description ||
        item.iconName !== orig.iconName ||
        item.iconUrl !== orig.iconUrl ||
        item.order !== orig.order
      )
        return true;
    }
    return false;
  }, [techDraftItems, canonicalTechItems]);

  const ensureTechDraft = useCallback(() => {
    setTechDraftItems((current) => current ?? canonicalTechItems.map((item) => ({ ...item })));
  }, [canonicalTechItems]);

  const updateTechField = useCallback(
    (itemId: string, field: keyof TechDraftItem, value: string | number) => {
      ensureTechDraft();
      setTechDraftItems((prev) => {
        if (!prev) return prev;
        return prev.map((item) => (item._id === itemId ? { ...item, [field]: value } : item));
      });
    },
    [ensureTechDraft],
  );

  const toggleTechExpand = useCallback(
    (itemId: string) => {
      ensureTechDraft();
      setTechDraftItems((prev) => {
        if (!prev) return prev;
        return prev.map((item) =>
          item._id === itemId ? { ...item, _isExpanded: !item._isExpanded } : item,
        );
      });
    },
    [ensureTechDraft],
  );

  const addTechDraftItem = useCallback(() => {
    ensureTechDraft();
    setTechDraftItems((prev) => {
      const items = prev ?? [];
      const maxOrder = items.reduce((max, item) => Math.max(max, item.order), 0);
      return [
        ...items,
        {
          _id: `temp-${crypto.randomUUID()}`,
          name: '',
          category: '',
          description: '',
          iconName: '',
          iconUrl: '',
          order: maxOrder + 1,
          _isNew: true,
          _isExpanded: true,
        },
      ];
    });
  }, [ensureTechDraft]);

  const deleteTechDraftItem = useCallback(
    (itemId: string) => {
      ensureTechDraft();
      setTechDraftItems((prev) => {
        if (!prev) return prev;
        if (itemId.startsWith('temp-')) {
          return prev.filter((item) => item._id !== itemId);
        }
        return prev.map((item) => (item._id === itemId ? { ...item, _isDeleted: true } : item));
      });
    },
    [ensureTechDraft],
  );

  const resetTechDraft = useCallback(() => {
    setTechDraftItems(null);
  }, []);

  const saveTechBatch = useCallback(async () => {
    if (!techDraftItems || !hasTechChanges) return;

    const nonDeleted = techDraftItems.filter((item) => !item._isDeleted);
    for (const item of nonDeleted) {
      if (!item.name.trim()) {
        toast({ title: 'Validation error', description: 'All technologies must have a name.', variant: 'destructive' });
        return;
      }
      if (!item.category.trim()) {
        toast({ title: 'Validation error', description: `"${item.name}" needs a category.`, variant: 'destructive' });
        return;
      }
    }

    const canonicalMap = new Map(canonicalTechItems.map((item) => [item._id, item]));

    const creates = techDraftItems
      .filter((item) => item._isNew && !item._isDeleted)
      .map((item) => ({
        name: item.name.trim(),
        category: item.category,
        description: item.description.trim() || undefined,
        iconName: item.iconName || undefined,
        iconUrl: item.iconUrl || undefined,
        order: item.order,
      }));

    const updates = techDraftItems
      .filter((item) => !item._isNew && !item._isDeleted && canonicalMap.has(item._id))
      .filter((item) => {
        const orig = canonicalMap.get(item._id)!;
        return (
          item.name !== orig.name ||
          item.category !== orig.category ||
          item.description !== orig.description ||
          item.iconName !== orig.iconName ||
          item.iconUrl !== orig.iconUrl ||
          item.order !== orig.order
        );
      })
      .map((item) => ({
        id: item._id as Id<'technologies'>,
        name: item.name.trim(),
        category: item.category,
        description: item.description.trim() || undefined,
        iconName: item.iconName || undefined,
        iconUrl: item.iconUrl || undefined,
        order: item.order,
      }));

    const deletes = techDraftItems
      .filter((item) => item._isDeleted && !item._isNew)
      .map((item) => item._id as Id<'technologies'>);

    setIsSavingTechBatch(true);
    try {
      const result = await batchSaveTechnologies({ creates, updates, deletes });
      toast({
        title: 'Technologies saved',
        description: `Created ${result.createdCount}, updated ${result.updatedCount}, deleted ${result.deletedCount}.`,
      });
      setTechDraftItems(null);
    } catch (err) {
      toast({ title: 'Save failed', description: String(err), variant: 'destructive' });
    } finally {
      setIsSavingTechBatch(false);
    }
  }, [techDraftItems, hasTechChanges, canonicalTechItems, batchSaveTechnologies, toast]);

  const aboutCategoryMap = useMemo(
    () => new Map((data.aboutCategories ?? []).map((category) => [asId(category._id), category])),
    [data.aboutCategories],
  );

  const providerMap = useMemo(
    () => new Map((data.cloudProviders ?? []).map((provider) => [asId(provider._id), provider])),
    [data.cloudProviders],
  );

  const certificateCountByProvider = useMemo(() => {
    const counts = new Map<string, number>();
    for (const certificate of data.certificates) {
      const key = asText(certificate.providerId);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [data.certificates]);

  const lookupContext = useMemo<LookupContext>(
    () => ({
      aboutCategoryMap,
      providerMap,
      certificateCountByProvider,
    }),
    [aboutCategoryMap, providerMap, certificateCountByProvider],
  );

  const providerOptions: SelectOption[] = useMemo(
    () =>
      data.cloudProviders
        .slice()
        .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))
        .map((provider) => ({
          value: asId(provider._id),
          label: asText(provider.name),
        })),
    [data.cloudProviders],
  );

  const aboutCategoryOptions: SelectOption[] = useMemo(
    () =>
      data.aboutCategories
        .slice()
        .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))
        .map((category) => ({
          value: asId(category._id),
          label: `${asText(category.label)} (${asText(category.name)})`,
        })),
    [data.aboutCategories],
  );

  const experienceCurrentRoleOptions = useMemo<ExperienceCurrentRoleOption[]>(
    () =>
      sortedExperiences.map((experience) => ({
        id: asId(experience._id),
        label: `${asText(experience.company)} · ${asText(experience.role)} (${asText(experience.duration)})`,
      })),
    [sortedExperiences],
  );

  const sectionConfigs = useMemo<Record<EntitySectionId, AdminSectionConfig>>(
    () => ({
      experiences: {
        id: 'experiences',
        title: 'Experiences',
        description: 'Manage timeline cards with company logo, role details, and tech stack.',
        emptyTitle: 'No experiences yet',
        emptyDescription: 'Create your first experience entry to populate the public timeline section.',
        items: data.experiences,
        createMutation: api.admin.createExperience,
        updateMutation: api.admin.updateExperience,
        deleteMutation: api.admin.deleteExperience,
        fields: [
          { key: 'company', label: 'Company', type: 'text', required: true },
          { key: 'role', label: 'Role', type: 'text', required: true },
          { key: 'duration', label: 'Duration', type: 'text', required: true },
          { key: 'location', label: 'Location', type: 'text', required: true },
          { key: 'description', label: 'Description', type: 'textarea', required: true },
          { key: 'technologies', label: 'Technologies (comma-separated)', type: 'csv', required: true },
          { key: 'order', label: 'Display Order', type: 'number', required: true },
        ],
        mediaFields: [{ key: 'logo', label: 'Company Logo', kind: 'logo' }],
      },
      projects: {
        id: 'projects',
        title: 'Projects',
        description: 'Manage featured projects, categories, and rich detail copy.',
        emptyTitle: 'No projects yet',
        emptyDescription: 'Create your first project to show work highlights on the public homepage.',
        items: data.projects,
        createMutation: api.admin.createProject,
        updateMutation: api.admin.updateProject,
        deleteMutation: api.admin.deleteProject,
        fields: [
          { key: 'title', label: 'Title', type: 'text', required: true },
          { key: 'description', label: 'Short Description', type: 'textarea', required: true },
          { key: 'longDescription', label: 'Long Description', type: 'textarea' },
          { key: 'categories', label: 'Categories (comma-separated)', type: 'csv', required: true },
          { key: 'techStack', label: 'Tech Stack (comma-separated)', type: 'csv', required: true },
          { key: 'features', label: 'Features (one per line)', type: 'list' },
          { key: 'challenges', label: 'Challenges (one per line)', type: 'list' },
          { key: 'outcomes', label: 'Outcomes (one per line)', type: 'list' },
          { key: 'timeline', label: 'Timeline', type: 'text' },
          { key: 'teamSize', label: 'Team Size', type: 'text' },
          { key: 'status', label: 'Status', type: 'select', options: PROJECT_STATUS_OPTIONS },
          { key: 'githubUrl', label: 'GitHub URL', type: 'text' },
          { key: 'liveUrl', label: 'Live URL', type: 'text' },
          { key: 'order', label: 'Display Order', type: 'number', required: true },
        ],
        mediaFields: [{ key: 'image', label: 'Project Cover Image', kind: 'image' }],
      },
      languages: {
        id: 'languages',
        title: 'Programming Languages',
        description: 'Manage language metadata and upload logos used in the public skills banner.',
        emptyTitle: 'No language entries yet',
        emptyDescription: 'Add languages to populate the skills section.',
        items: data.programmingLanguages,
        createMutation: api.admin.createProgrammingLanguage,
        updateMutation: api.admin.updateProgrammingLanguage,
        deleteMutation: api.admin.deleteProgrammingLanguage,
        fields: [
          { key: 'name', label: 'Name', type: 'text', required: true },
          { key: 'level', label: 'Level', type: 'select', required: true, options: LANGUAGE_LEVEL_OPTIONS },
          { key: 'description', label: 'Description', type: 'textarea', required: true },
          { key: 'order', label: 'Display Order', type: 'number', required: true },
        ],
        mediaFields: [{ key: 'logoUrl', label: 'Language Logo', kind: 'logo' }],
      },
      technologies: {
        id: 'technologies',
        title: 'Technologies',
        description: 'Manage technology chips and category mapping.',
        emptyTitle: 'No technologies yet',
        emptyDescription: 'Add technologies to populate stack sections across the site.',
        items: data.technologies,
        createMutation: api.admin.createTechnology,
        updateMutation: api.admin.updateTechnology,
        deleteMutation: api.admin.deleteTechnology,
        fields: [
          { key: 'name', label: 'Name', type: 'text', required: true },
          { key: 'category', label: 'Category', type: 'select', required: true, options: TECHNOLOGY_CATEGORY_OPTIONS },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'iconName', label: 'Icon', type: 'icon-picker' },
          { key: 'order', label: 'Display Order', type: 'number', required: true },
        ],
        mediaFields: [{ key: 'iconUrl', label: 'Custom Icon Image', kind: 'logo' as const }],
      },
      providers: {
        id: 'providers',
        title: 'Cloud Providers',
        description: 'Manage certification provider groupings.',
        emptyTitle: 'No cloud providers yet',
        emptyDescription: 'Add providers before creating certificates that reference them.',
        items: data.cloudProviders,
        createMutation: api.admin.createCloudProvider,
        updateMutation: api.admin.updateCloudProvider,
        deleteMutation: api.admin.deleteCloudProvider,
        fields: [
          { key: 'name', label: 'Provider Name', type: 'text', required: true },
          { key: 'iconName', label: 'Icon', type: 'icon-picker' },
          { key: 'order', label: 'Display Order', type: 'number', required: true },
        ],
        mediaFields: [{ key: 'iconUrl', label: 'Custom Icon Image', kind: 'logo' as const }],
      },
      certificates: {
        id: 'certificates',
        title: 'Certificates',
        description: 'Manage certificates, verification links, and skills metadata.',
        emptyTitle: 'No certificates yet',
        emptyDescription: 'Add certificates to showcase cloud and platform credentials.',
        items: data.certificates,
        createMutation: api.admin.createCertificate,
        updateMutation: api.admin.updateCertificate,
        deleteMutation: api.admin.deleteCertificate,
        fields: [
          { key: 'name', label: 'Certificate Name', type: 'text', required: true },
          { key: 'providerId', label: 'Provider', type: 'select', required: true, options: providerOptions },
          { key: 'year', label: 'Year', type: 'text', required: true },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'issuer', label: 'Issuer', type: 'text' },
          { key: 'credentialId', label: 'Credential ID', type: 'text' },
          { key: 'verificationUrl', label: 'Verification URL', type: 'text' },
          { key: 'skills', label: 'Skills (comma-separated)', type: 'csv' },
          { key: 'order', label: 'Display Order', type: 'number', required: true },
        ],
        mediaFields: [{ key: 'image', label: 'Certificate Image', kind: 'image', required: true }],
      },
      'about-categories': {
        id: 'about-categories',
        title: 'About Categories',
        description: 'Manage category tabs used in About timeline blocks.',
        emptyTitle: 'No about categories yet',
        emptyDescription: 'Create categories before adding about items.',
        items: data.aboutCategories,
        createMutation: api.admin.createAboutCategory,
        updateMutation: api.admin.updateAboutCategory,
        deleteMutation: api.admin.deleteAboutCategory,
        fields: [
          { key: 'name', label: 'Internal Name', type: 'text', required: true },
          { key: 'label', label: 'Display Label', type: 'text', required: true },
          { key: 'color', label: 'Color (Hex)', type: 'text', required: true },
          { key: 'icon', label: 'Icon Name', type: 'text', required: true },
          { key: 'order', label: 'Display Order', type: 'number', required: true },
        ],
        mediaFields: [],
      },
      'about-items': {
        id: 'about-items',
        title: 'About Items',
        description: 'Manage item cards displayed in about section carousels.',
        emptyTitle: 'No about items yet',
        emptyDescription: 'Create items under categories to populate the About section.',
        items: data.aboutItems,
        createMutation: api.admin.createAboutItem,
        updateMutation: api.admin.updateAboutItem,
        deleteMutation: api.admin.deleteAboutItem,
        fields: [
          { key: 'categoryId', label: 'Category', type: 'select', required: true, options: aboutCategoryOptions },
          { key: 'title', label: 'Title', type: 'text', required: true },
          { key: 'subtitle', label: 'Subtitle', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'date', label: 'Date', type: 'text' },
          { key: 'details', label: 'Details (one per line)', type: 'list' },
          { key: 'icon', label: 'Icon Name', type: 'text', required: true },
          { key: 'order', label: 'Display Order', type: 'number', required: true },
        ],
        mediaFields: [{ key: 'image', label: 'About Item Image', kind: 'image' }],
      },
    }),
    [data, providerOptions, aboutCategoryOptions],
  );

  const tabs: Array<{ id: SectionId; label: string }> = [
    { id: 'site-settings', label: 'Site Settings' },
    { id: 'experiences', label: 'Experiences' },
    { id: 'projects', label: 'Projects' },
    { id: 'languages', label: 'Programming Languages' },
    { id: 'technologies', label: 'Technologies' },
    { id: 'providers', label: 'Cloud Providers' },
    { id: 'certificates', label: 'Certificates' },
    { id: 'about-categories', label: 'About Categories' },
    { id: 'about-items', label: 'About Items' },
  ];

  const activeEntityConfig = activeSectionId === 'site-settings' ? null : sectionConfigs[activeSectionId];
  const activeItems = useMemo(
    () => (activeEntityConfig ? getSectionItems(activeEntityConfig.id, data) : []),
    [activeEntityConfig, data],
  );

  const sortedItems = useMemo(
    () => sortByOrder(activeItems),
    [activeItems],
  );

  const displayItems = useMemo(
    () =>
      activeSectionId === 'projects'
        ? effectiveProjectItems
        : activeSectionId === 'experiences'
          ? effectiveExperienceItems
          : activeSectionId === 'technologies'
            ? effectiveTechItems as unknown as AdminEntity[]
            : sortedItems,
    [activeSectionId, effectiveExperienceItems, effectiveProjectItems, effectiveTechItems, sortedItems],
  );

  const selectedItem = useMemo(
    () => displayItems.find((item) => asId(item._id) === selectedItemId) ?? null,
    [displayItems, selectedItemId],
  );

  const sectionTitle = activeSectionId === 'site-settings' ? 'Site Settings' : activeEntityConfig?.title ?? 'Section';
  const sectionDescription =
    activeSectionId === 'site-settings'
      ? 'Manage global branding assets and metadata used across the site.'
      : activeEntityConfig?.description ?? '';

  const closeInspector = useCallback(() => {
    setPanelMode('view');
    setSelectedItemId(null);
    setMobileInspectorOpen(false);
  }, []);

  const openCreate = useCallback(() => {
    setSelectedItemId(null);
    setPanelMode('create');
    if (!isDesktop) {
      setMobileInspectorOpen(true);
    }
  }, [isDesktop]);

  const openView = useCallback(
    (itemId: string) => {
      setSelectedItemId(itemId);
      setPanelMode('view');
      if (!isDesktop) {
        setMobileInspectorOpen(true);
      }
    },
    [isDesktop],
  );

  const openEdit = useCallback(
    (itemId: string) => {
      setSelectedItemId(itemId);
      setPanelMode('edit');
      if (!isDesktop) {
        setMobileInspectorOpen(true);
      }
    },
    [isDesktop],
  );

  const openDelete = useCallback(
    (itemId: string) => {
      setSelectedItemId(itemId);
      setPanelMode('deleteConfirm');
      if (!isDesktop) {
        setMobileInspectorOpen(true);
      }
    },
    [isDesktop],
  );

  const handleExperienceReorder = useCallback((nextIds: string[]) => {
    setExperienceDraftOrderIds(nextIds);
  }, []);

  const handleExperienceCurrentRoleChange = useCallback(
    (nextCurrentRoleId: string | null) => {
      setExperienceDraftCurrentRoleId(
        nextCurrentRoleId === canonicalCurrentExperienceId ? undefined : nextCurrentRoleId,
      );
    },
    [canonicalCurrentExperienceId],
  );

  const resetExperienceLayoutDraft = useCallback(() => {
    setExperienceDraftOrderIds(null);
    setExperienceDraftCurrentRoleId(undefined);
  }, []);

  const handleProjectReorder = useCallback((nextIds: string[]) => {
    setProjectDraftOrderIds(nextIds);
  }, []);

  const resetProjectOrderDraft = useCallback(() => {
    setProjectDraftOrderIds(null);
  }, []);

  const saveExperienceLayout = useCallback(async () => {
    if (!hasExperienceChanges) {
      return;
    }

    setIsSavingExperienceLayout(true);
    try {
      const payload: ReorderItem[] = effectiveExperienceItems.map((item, index) => ({
        id: asId(item._id),
        order: index + 1,
      }));

      const result = await reorderExperiences({
        items: payload.map((item) => ({ id: item.id as Id<'experiences'>, order: item.order })),
        currentExperienceId: effectiveCurrentExperienceId
          ? (effectiveCurrentExperienceId as Id<'experiences'>)
          : null,
      });

      setExperienceDraftOrderIds(null);
      setExperienceDraftCurrentRoleId(undefined);
      toast({
        title: 'Experience layout saved',
        description: `Updated ${result.updatedCount} experiences.`,
      });
    } catch (error) {
      toast({
        title: 'Unable to save experience layout',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingExperienceLayout(false);
    }
  }, [
    effectiveCurrentExperienceId,
    effectiveExperienceItems,
    hasExperienceChanges,
    reorderExperiences,
    toast,
  ]);

  const saveProjectOrder = useCallback(async () => {
    if (!hasProjectOrderChanges || !projectDraftOrderIds) {
      return;
    }

    setIsSavingProjectOrder(true);
    try {
      const payload: ReorderItem[] = projectDraftOrderIds.map((id, index) => ({
        id,
        order: index + 1,
      }));

      const result = await reorderProjects({
        items: payload.map((item) => ({ id: item.id as Id<'projects'>, order: item.order })),
      });

      setProjectDraftOrderIds(null);
      toast({
        title: 'Project order saved',
        description: `Updated ${result.updatedCount} projects.`,
      });
    } catch (error) {
      toast({
        title: 'Unable to save project order',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProjectOrder(false);
    }
  }, [hasProjectOrderChanges, projectDraftOrderIds, reorderProjects, toast]);

  const isSiteSettingsSection = activeSectionId === 'site-settings';
  const desktopInspectorOpen = useMemo(
    () => panelMode !== 'view' || selectedItemId !== null,
    [panelMode, selectedItemId],
  );

  if (!bootstrap) {
    return (
      <div className="min-h-screen bg-background px-6 py-10 text-foreground">
        <div className="container mx-auto">Loading admin dashboard...</div>
      </div>
    );
  }

  const inspectorBody =
    activeSectionId === 'site-settings' ? (
      <SiteSettingsInspector
        mode={panelMode}
        settings={data.siteSettings}
        onModeChange={setPanelMode}
        onClose={closeInspector}
        generateUploadUrl={generateUploadUrl}
        resolveStorageUrl={resolveStorageUrl}
      />
    ) : activeSectionId === 'technologies' ? null
    : activeEntityConfig ? (
      <EntityInspector
        config={activeEntityConfig}
        selectedItem={selectedItem}
        mode={panelMode}
        context={lookupContext}
        onModeChange={setPanelMode}
        onSelectedIdChange={setSelectedItemId}
        onClose={closeInspector}
        onDeleted={closeInspector}
        generateUploadUrl={generateUploadUrl}
        resolveStorageUrl={resolveStorageUrl}
      />
    ) : null;

  const cardList = isSiteSettingsSection ? (
    data.siteSettings ? (
      <button
        type="button"
        className={cn(
          'group w-full rounded-2xl border p-4 text-left transition-all duration-300',
          selectedItemId
            ? 'border-primary/60 bg-primary/5 shadow-lg shadow-primary/10'
            : 'border-border/60 bg-background-subtle/30 hover:border-primary/30 hover:bg-background-subtle/60',
        )}
        onClick={() => {
          setSelectedItemId(asId(data.siteSettings?._id ?? 'site-settings'));
          setPanelMode('view');
          if (!isDesktop) {
            setMobileInspectorOpen(true);
          }
        }}
      >
        <p className="font-display text-lg text-foreground">{asText(data.siteSettings.siteName, 'Portfolio Settings')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{asText(data.siteSettings.tagline, 'No tagline configured.')}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline">{data.siteSettings.logoUrl ? 'Logo uploaded' : 'No logo'}</Badge>
          <Badge variant="outline">{data.siteSettings.profileImageUrl ? 'Profile uploaded' : 'No profile image'}</Badge>
          <Badge variant="outline">{data.siteSettings.resumeUrl ? 'Resume uploaded' : 'No resume'}</Badge>
        </div>
      </button>
    ) : (
      <EmptyState
        title="No site settings yet"
        description="Create a singleton settings record for your global branding assets."
        onCreate={() => {
          setPanelMode('create');
          if (!isDesktop) {
            setMobileInspectorOpen(true);
          }
        }}
      />
    )
  ) : activeEntityConfig ? (
    activeEntityConfig.id === 'projects' ? (
      displayItems.length === 0 ? (
        <EmptyState
          title={activeEntityConfig.emptyTitle}
          description={activeEntityConfig.emptyDescription}
          onCreate={openCreate}
        />
      ) : (
        <div className="space-y-4">
          <ProjectOrderToolbar
            hasChanges={hasProjectOrderChanges}
            isSaving={isSavingProjectOrder}
            onReset={resetProjectOrderDraft}
            onSave={() => {
              void saveProjectOrder();
            }}
          />

          <SortableProjectGrid
            items={displayItems}
            selectedItemId={selectedItemId}
            context={lookupContext}
            onOpen={openView}
            onEdit={openEdit}
            onDelete={openDelete}
            onReorder={handleProjectReorder}
          />
        </div>
      )
    ) : activeEntityConfig.id === 'experiences' ? (
      displayItems.length === 0 ? (
        <EmptyState
          title={activeEntityConfig.emptyTitle}
          description={activeEntityConfig.emptyDescription}
          onCreate={openCreate}
        />
      ) : (
        <div className="space-y-4">
          <ExperienceLayoutToolbar
            hasChanges={hasExperienceChanges}
            isSaving={isSavingExperienceLayout}
            currentRoleId={effectiveCurrentExperienceId}
            currentRoleOptions={experienceCurrentRoleOptions}
            onCurrentRoleChange={handleExperienceCurrentRoleChange}
            onReset={resetExperienceLayoutDraft}
            onSave={() => {
              void saveExperienceLayout();
            }}
          />

          <SortableExperienceGrid
            items={displayItems}
            selectedItemId={selectedItemId}
            context={lookupContext}
            onOpen={openView}
            onEdit={openEdit}
            onDelete={openDelete}
            onReorder={handleExperienceReorder}
          />
        </div>
      )
    ) : activeEntityConfig.id === 'technologies' ? (
      <div className="space-y-4">
        <TechBatchToolbar
          hasChanges={hasTechChanges}
          isSaving={isSavingTechBatch}
          onAdd={addTechDraftItem}
          onSave={() => { void saveTechBatch(); }}
          onCancel={resetTechDraft}
        />
        {effectiveTechItems.length === 0 ? (
          <EmptyState
            title={activeEntityConfig.emptyTitle}
            description={activeEntityConfig.emptyDescription}
            onCreate={addTechDraftItem}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {effectiveTechItems.map((item) => (
              <TechEditableCard
                key={item._id}
                item={item}
                onFieldChange={updateTechField}
                onToggleExpand={toggleTechExpand}
                onDelete={deleteTechDraftItem}
                generateUploadUrl={generateUploadUrl}
                resolveStorageUrl={resolveStorageUrl}
              />
            ))}
          </div>
        )}
      </div>
    ) : (
      <SectionCardGrid
        config={activeEntityConfig}
        items={displayItems}
        selectedItemId={selectedItemId}
        context={lookupContext}
        onCreate={openCreate}
        onOpen={openView}
        onEdit={openEdit}
        onDelete={openDelete}
      />
    )
  ) : null;

  return (
    <>
      <AdminWorkspaceShell
        user={user}
        tabs={tabs}
        activeSectionId={activeSectionId}
        onSectionChange={(nextId) => {
          if (hasTechChanges) {
            if (!window.confirm('You have unsaved technology changes. Discard them?')) return;
            resetTechDraft();
          }
          setActiveSectionId(nextId);
        }}
        sectionTitle={sectionTitle}
        sectionDescription={sectionDescription}
        onCreateOrEditSettings={() => {
          setSelectedItemId(data.siteSettings ? asId(data.siteSettings._id) : null);
          setPanelMode(data.siteSettings ? 'edit' : 'create');
          if (!isDesktop) {
            setMobileInspectorOpen(true);
          }
        }}
        onCreateItem={activeSectionId === 'technologies' ? addTechDraftItem : openCreate}
        isSiteSettingsSection={isSiteSettingsSection}
        hasSiteSettings={Boolean(data.siteSettings)}
        cardList={cardList}
        inspector={inspectorBody}
        inspectorOpen={activeSectionId === 'technologies' ? false : desktopInspectorOpen}
      />

      <ItemInspectorDrawer
        open={!isDesktop && mobileInspectorOpen}
        onOpenChange={setMobileInspectorOpen}
        title={sectionTitle}
        description={sectionDescription}
      >
        {inspectorBody}
      </ItemInspectorDrawer>
    </>
  );
}
