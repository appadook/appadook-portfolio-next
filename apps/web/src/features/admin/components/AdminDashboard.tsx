"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminApi } from "@/features/admin/api/convexAdmin";
import { AdminWorkspaceShell } from "@/features/admin/components/AdminWorkspaceShell";
import {
  LANGUAGE_LEVEL_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  TECHNOLOGY_CATEGORY_OPTIONS,
} from "@/features/admin/config/sectionConfigs";
import { useAdminDashboardController } from "@/features/admin/hooks/useAdminDashboardController";
import { useAdminLocation } from "@/features/admin/hooks/useAdminLocation";
import {
  confirmEditorNavigation,
  useBulkDirty,
} from "@/features/admin/hooks/useEditorDraft";
import { asId, asText } from "@/features/admin/lib/normalizers";
import { areSameIdOrder, sortByOrder } from "@/features/admin/lib/ordering";
import type {
  AdminEntity,
  AdminSectionConfig,
  AdminUser,
  BootstrapData,
  EntitySectionId,
  SectionId,
  SelectOption,
} from "@/features/admin/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { api } from "@portfolio/backend/convex/_generated/api";
import type { Id } from "@portfolio/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ExperienceCurrentRoleOption,
  ExperienceDraftOrder,
  LookupContext,
  ProjectDraftOrder,
  ReorderItem,
  TechDraftItem,
} from "./adminShared";
import {
  ADMIN_TABS,
  DEFAULT_BOOTSTRAP,
  getSectionItems,
  getCardTitle,
  getCardSubtitle,
} from "./adminShared";
import { EmptyState, SectionCardGrid } from "./ContentCards";
import { EntityInspector } from "./EntityInspector";
import {
  ExperienceLayoutToolbar,
  ProjectOrderToolbar,
  SortableExperienceGrid,
  SortableProjectGrid,
} from "./Ordering";
import { SiteSettingsInspector } from "./SettingsInspector";
import { MediaLibrary } from "./MediaLibrary";
import { InboxWorkspace } from "./InboxWorkspace";
import { TechBatchToolbar, TechEditableCard } from "./TechnologyEditor";

export default function AdminDashboard({
  user,
  initialData,
}: {
  user: AdminUser;
  initialData: BootstrapData;
}) {
  const { toast } = useToast();

  const {
    bootstrap,
    generateUploadUrl,
    resolveStorageUrl,
    reorderExperiences,
    reorderProjects,
    batchSaveTechnologies,
  } = useAdminDashboardController(initialData);
  const publication = useQuery(api.publishing.status);

  const {
    activeSectionId,
    setActiveSectionId,
    selectedItemId,
    setSelectedItemId,
    panelMode,
    setPanelMode,
  } = useAdminLocation();
  const [searches, setSearches] = useState<Record<string, string>>({});
  const search = searches[activeSectionId] ?? "";
  const setSearch = (value: string) =>
    setSearches((current) => ({ ...current, [activeSectionId]: value }));
  const [filters, setFilters] = useState<Record<string, string>>({});
  const filter = filters[activeSectionId] ?? "";
  const [reordering, setReordering] = useState(false);
  const [batchEditing, setBatchEditing] = useState(false);
  const bulkRevision = useRef(0);
  const [experienceDraftOrderIds, setExperienceDraftOrderIds] =
    useState<ExperienceDraftOrder>(null);
  const [experienceDraftCurrentRoleId, setExperienceDraftCurrentRoleId] =
    useState<string | null | undefined>(undefined);
  const [isSavingExperienceLayout, setIsSavingExperienceLayout] =
    useState(false);
  const [projectDraftOrderIds, setProjectDraftOrderIds] =
    useState<ProjectDraftOrder>(null);
  const [isSavingProjectOrder, setIsSavingProjectOrder] = useState(false);
  const [techDraftItems, setTechDraftItems] = useState<TechDraftItem[] | null>(
    null,
  );
  const [isSavingTechBatch, setIsSavingTechBatch] = useState(false);
  const [pendingSectionId, setPendingSectionId] = useState<SectionId | null>(
    null,
  );
  const [isDiscardTechChangesDialogOpen, setIsDiscardTechChangesDialogOpen] =
    useState(false);

  const data = bootstrap ?? DEFAULT_BOOTSTRAP;
  const sortedExperiences = useMemo(
    () => sortByOrder(data.experiences),
    [data.experiences],
  );
  const canonicalExperienceOrderIds = useMemo(
    () => sortedExperiences.map((item) => asId(item._id)),
    [sortedExperiences],
  );
  const experiencesById = useMemo(
    () => new Map(sortedExperiences.map((item) => [asId(item._id), item])),
    [sortedExperiences],
  );
  const canonicalCurrentExperienceId =
    sortedExperiences.find((item) => item.isCurrent === true)?._id ?? null;

  const sortedProjects = useMemo(
    () => sortByOrder(data.projects),
    [data.projects],
  );
  const canonicalProjectOrderIds = useMemo(
    () => sortedProjects.map((item) => asId(item._id)),
    [sortedProjects],
  );
  const projectsById = useMemo(
    () => new Map(sortedProjects.map((item) => [asId(item._id), item])),
    [sortedProjects],
  );

  const hasExperienceOrderChanges = useMemo(() => {
    if (!experienceDraftOrderIds) {
      return false;
    }
    return !areSameIdOrder(
      experienceDraftOrderIds,
      canonicalExperienceOrderIds,
    );
  }, [experienceDraftOrderIds, canonicalExperienceOrderIds]);

  const hasExperienceCurrentRoleChanges = useMemo(() => {
    return (
      experienceDraftCurrentRoleId !== undefined &&
      experienceDraftCurrentRoleId !== canonicalCurrentExperienceId
    );
  }, [experienceDraftCurrentRoleId, canonicalCurrentExperienceId]);

  const hasExperienceChanges =
    hasExperienceOrderChanges || hasExperienceCurrentRoleChanges;

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

  const sortedTechnologies = useMemo(
    () => sortByOrder(data.technologies),
    [data.technologies],
  );

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
    () =>
      (techDraftItems ?? canonicalTechItems).filter((item) => !item._isDeleted),
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
    setTechDraftItems(
      (current) => current ?? canonicalTechItems.map((item) => ({ ...item })),
    );
  }, [canonicalTechItems]);

  const updateTechField = useCallback(
    (itemId: string, field: keyof TechDraftItem, value: string | number) => {
      ensureTechDraft();
      setTechDraftItems((prev) => {
        if (!prev) return prev;
        return prev.map((item) =>
          item._id === itemId ? { ...item, [field]: value } : item,
        );
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
          item._id === itemId
            ? { ...item, _isExpanded: !item._isExpanded }
            : item,
        );
      });
    },
    [ensureTechDraft],
  );

  const addTechDraftItem = useCallback(() => {
    ensureTechDraft();
    setTechDraftItems((prev) => {
      const items = prev ?? [];
      const maxOrder = items.reduce(
        (max, item) => Math.max(max, item.order),
        0,
      );
      return [
        ...items,
        {
          _id: `temp-${crypto.randomUUID()}`,
          name: "",
          category: "",
          description: "",
          iconName: "",
          iconUrl: "",
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
        if (itemId.startsWith("temp-")) {
          return prev.filter((item) => item._id !== itemId);
        }
        return prev.map((item) =>
          item._id === itemId ? { ...item, _isDeleted: true } : item,
        );
      });
    },
    [ensureTechDraft],
  );

  const resetTechDraft = useCallback(() => {
    setTechDraftItems(null);
  }, []);

  const confirmDiscardTechDraftAndSwitchSection = useCallback(() => {
    resetTechDraft();
    if (pendingSectionId) {
      setActiveSectionId(pendingSectionId);
    }
    setPendingSectionId(null);
    setIsDiscardTechChangesDialogOpen(false);
  }, [pendingSectionId, resetTechDraft, setActiveSectionId]);

  const cancelDiscardTechDraftDialog = useCallback(() => {
    setPendingSectionId(null);
    setIsDiscardTechChangesDialogOpen(false);
  }, []);

  const saveTechBatch = useCallback(async () => {
    if (!techDraftItems || !hasTechChanges) return;

    const nonDeleted = techDraftItems.filter((item) => !item._isDeleted);
    for (const item of nonDeleted) {
      if (!item.name.trim()) {
        toast({
          title: "Validation error",
          description: "All technologies must have a name.",
          variant: "destructive",
        });
        return;
      }
      if (!item.category.trim()) {
        toast({
          title: "Validation error",
          description: `"${item.name}" needs a category.`,
          variant: "destructive",
        });
        return;
      }
    }

    const canonicalMap = new Map(
      canonicalTechItems.map((item) => [item._id, item]),
    );

    const creates = techDraftItems
      .filter((item) => item._isNew && !item._isDeleted)
      .map((item) => ({
        name: item.name.trim(),
        category: item.category,
        description: item.description.trim() || undefined,
        iconName: item.iconName.trim() || undefined,
        iconUrl: item.iconUrl.trim() || undefined,
        order: item.order,
      }));

    const updates = techDraftItems
      .filter(
        (item) =>
          !item._isNew && !item._isDeleted && canonicalMap.has(item._id),
      )
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
        id: item._id as Id<"technologies">,
        clearFields: (["description", "iconName", "iconUrl"] as const).filter(
          (field) => !item[field].trim(),
        ),
        name: item.name.trim(),
        category: item.category,
        description: item.description.trim() || undefined,
        iconName: item.iconName.trim() || undefined,
        iconUrl: item.iconUrl.trim() || undefined,
        order: item.order,
      }));

    const deletes = techDraftItems
      .filter((item) => item._isDeleted && !item._isNew)
      .map((item) => item._id as Id<"technologies">);

    setIsSavingTechBatch(true);
    try {
      const result = await batchSaveTechnologies({
        creates,
        updates,
        deletes,
        expectedRevision: bulkRevision.current,
      });
      toast({
        title: "Technologies saved",
        description: `Created ${result.createdCount}, updated ${result.updatedCount}, deleted ${result.deletedCount}.`,
      });
      setTechDraftItems(null);
    } catch (err) {
      toast({
        title: "Save failed",
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setIsSavingTechBatch(false);
    }
  }, [
    techDraftItems,
    hasTechChanges,
    canonicalTechItems,
    batchSaveTechnologies,
    toast,
  ]);

  const aboutCategoryMap = useMemo(
    () =>
      new Map(
        (data.aboutCategories ?? []).map((category) => [
          asId(category._id),
          category,
        ]),
      ),
    [data.aboutCategories],
  );

  const providerMap = useMemo(
    () =>
      new Map(
        (data.cloudProviders ?? []).map((provider) => [
          asId(provider._id),
          provider,
        ]),
      ),
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
        id: "experiences",
        title: "Experiences",
        description:
          "Manage timeline cards with company logo, role details, and tech stack.",
        emptyTitle: "No experiences yet",
        emptyDescription:
          "Create your first experience entry to populate the public timeline section.",
        items: data.experiences,
        createMutation: adminApi.createExperience,
        updateMutation: adminApi.updateExperience,
        deleteMutation: adminApi.deleteExperience,
        fields: [
          { key: "company", label: "Company", type: "text", required: true },
          { key: "role", label: "Role", type: "text", required: true },
          { key: "duration", label: "Duration", type: "text", required: true },
          { key: "location", label: "Location", type: "text", required: true },
          {
            key: "description",
            label: "Description",
            type: "textarea",
            required: true,
          },
          {
            key: "technologies",
            label: "Technologies (comma-separated)",
            type: "csv",
            required: true,
          },
          {
            key: "order",
            label: "Display Order",
            type: "number",
            required: true,
          },
        ],
        mediaFields: [{ key: "logo", label: "Company Logo", kind: "logo" }],
      },
      projects: {
        id: "projects",
        title: "Projects",
        description: "Shape how your work appears on the portfolio.",
        emptyTitle: "No projects yet",
        emptyDescription:
          "Create your first project to show work highlights on the public homepage.",
        items: data.projects,
        createMutation: adminApi.createProject,
        updateMutation: adminApi.updateProject,
        deleteMutation: adminApi.deleteProject,
        fields: [
          { key: "title", label: "Title", type: "text", required: true },
          {
            key: "description",
            label: "Short Description",
            type: "textarea",
            required: true,
          },
          {
            key: "longDescription",
            label: "Long Description",
            type: "textarea",
          },
          {
            key: "categories",
            label: "Categories (comma-separated)",
            type: "csv",
            required: true,
          },
          {
            key: "techStack",
            label: "Tech Stack (comma-separated)",
            type: "csv",
            required: true,
          },
          { key: "features", label: "Features (one per line)", type: "list" },
          {
            key: "challenges",
            label: "Challenges (one per line)",
            type: "list",
          },
          { key: "outcomes", label: "Outcomes (one per line)", type: "list" },
          { key: "timeline", label: "Timeline", type: "text" },
          { key: "teamSize", label: "Team Size", type: "text" },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: PROJECT_STATUS_OPTIONS,
          },
          { key: "githubUrl", label: "GitHub URL", type: "text" },
          { key: "liveUrl", label: "Live URL", type: "text" },
          {
            key: "order",
            label: "Display Order",
            type: "number",
            required: true,
          },
        ],
        mediaFields: [
          { key: "image", label: "Project Cover Image", kind: "image" },
        ],
      },
      languages: {
        id: "languages",
        title: "Programming Languages",
        description:
          "Manage language metadata and upload logos used in the public skills banner.",
        emptyTitle: "No language entries yet",
        emptyDescription: "Add languages to populate the skills section.",
        items: data.programmingLanguages,
        createMutation: adminApi.createProgrammingLanguage,
        updateMutation: adminApi.updateProgrammingLanguage,
        deleteMutation: adminApi.deleteProgrammingLanguage,
        fields: [
          { key: "name", label: "Name", type: "text", required: true },
          {
            key: "level",
            label: "Level",
            type: "select",
            required: true,
            options: LANGUAGE_LEVEL_OPTIONS,
          },
          {
            key: "description",
            label: "Description",
            type: "textarea",
            required: true,
          },
          {
            key: "order",
            label: "Display Order",
            type: "number",
            required: true,
          },
        ],
        mediaFields: [{ key: "logoUrl", label: "Language Logo", kind: "logo" }],
      },
      technologies: {
        id: "technologies",
        title: "Technologies",
        description: "Manage technology chips and category mapping.",
        emptyTitle: "No technologies yet",
        emptyDescription:
          "Add technologies to populate stack sections across the site.",
        items: data.technologies,
        createMutation: adminApi.createTechnology,
        updateMutation: adminApi.updateTechnology,
        deleteMutation: adminApi.deleteTechnology,
        fields: [
          { key: "name", label: "Name", type: "text", required: true },
          {
            key: "category",
            label: "Category",
            type: "select",
            required: true,
            options: TECHNOLOGY_CATEGORY_OPTIONS,
          },
          { key: "description", label: "Description", type: "textarea" },
          { key: "iconName", label: "Icon", type: "icon-picker" },
          {
            key: "order",
            label: "Display Order",
            type: "number",
            required: true,
          },
        ],
        mediaFields: [
          { key: "iconUrl", label: "Custom Icon Image", kind: "logo" as const },
        ],
      },
      providers: {
        id: "providers",
        title: "Cloud Providers",
        description: "Organize the providers behind your certifications.",
        emptyTitle: "No cloud providers yet",
        emptyDescription:
          "Add providers before creating certificates that reference them.",
        items: data.cloudProviders,
        createMutation: adminApi.createCloudProvider,
        updateMutation: adminApi.updateCloudProvider,
        deleteMutation: adminApi.deleteCloudProvider,
        fields: [
          { key: "name", label: "Provider Name", type: "text", required: true },
          { key: "iconName", label: "Icon", type: "icon-picker" },
          {
            key: "order",
            label: "Display Order",
            type: "number",
            required: true,
          },
        ],
        mediaFields: [
          { key: "iconUrl", label: "Custom Icon Image", kind: "logo" as const },
        ],
      },
      certificates: {
        id: "certificates",
        title: "Certificates",
        description:
          "Manage certificates, verification links, and skills metadata.",
        emptyTitle: "No certificates yet",
        emptyDescription:
          "Add certificates to showcase cloud and platform credentials.",
        items: data.certificates,
        createMutation: adminApi.createCertificate,
        updateMutation: adminApi.updateCertificate,
        deleteMutation: adminApi.deleteCertificate,
        fields: [
          {
            key: "name",
            label: "Certificate Name",
            type: "text",
            required: true,
          },
          {
            key: "providerId",
            label: "Provider",
            type: "select",
            required: true,
            options: providerOptions,
          },
          { key: "year", label: "Year", type: "text", required: true },
          { key: "description", label: "Description", type: "textarea" },
          { key: "issuer", label: "Issuer", type: "text" },
          { key: "credentialId", label: "Credential ID", type: "text" },
          { key: "verificationUrl", label: "Verification URL", type: "text" },
          { key: "skills", label: "Skills (comma-separated)", type: "csv" },
          {
            key: "order",
            label: "Display Order",
            type: "number",
            required: true,
          },
        ],
        mediaFields: [
          {
            key: "image",
            label: "Certificate Image",
            kind: "image",
            required: true,
          },
        ],
      },
      "about-categories": {
        id: "about-categories",
        title: "About Categories",
        description: "Organize your timeline into meaningful categories.",
        emptyTitle: "No about categories yet",
        emptyDescription: "Create categories before adding about items.",
        items: data.aboutCategories,
        createMutation: adminApi.createAboutCategory,
        updateMutation: adminApi.updateAboutCategory,
        deleteMutation: adminApi.deleteAboutCategory,
        fields: [
          { key: "name", label: "Internal Name", type: "text", required: true },
          {
            key: "label",
            label: "Display Label",
            type: "text",
            required: true,
          },
          { key: "color", label: "Color (Hex)", type: "text", required: true },
          { key: "icon", label: "Icon Name", type: "text", required: true },
          {
            key: "order",
            label: "Display Order",
            type: "number",
            required: true,
          },
        ],
        mediaFields: [],
      },
      "about-items": {
        id: "about-items",
        title: "About Items",
        description: "Build the personal timeline behind your portfolio.",
        emptyTitle: "No about items yet",
        emptyDescription:
          "Create items under categories to populate the About section.",
        items: data.aboutItems,
        createMutation: adminApi.createAboutItem,
        updateMutation: adminApi.updateAboutItem,
        deleteMutation: adminApi.deleteAboutItem,
        fields: [
          {
            key: "categoryId",
            label: "Category",
            type: "select",
            required: true,
            options: aboutCategoryOptions,
          },
          { key: "title", label: "Title", type: "text", required: true },
          { key: "subtitle", label: "Subtitle", type: "text" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "date", label: "Date", type: "text" },
          { key: "details", label: "Details (one per line)", type: "list" },
          { key: "icon", label: "Icon Name", type: "text", required: true },
          {
            key: "order",
            label: "Display Order",
            type: "number",
            required: true,
          },
        ],
        mediaFields: [
          { key: "image", label: "About Item Image", kind: "image" },
        ],
      },
    }),
    [data, providerOptions, aboutCategoryOptions],
  );

  const activeEntityConfig = ["site-settings", "media", "inbox"].includes(
    activeSectionId,
  )
    ? null
    : sectionConfigs[activeSectionId as EntitySectionId];
  const activeItems = useMemo(
    () =>
      activeEntityConfig ? getSectionItems(activeEntityConfig.id, data) : [],
    [activeEntityConfig, data],
  );

  const sortedItems = useMemo(() => sortByOrder(activeItems), [activeItems]);

  const displayItems = useMemo(
    () =>
      activeSectionId === "projects"
        ? effectiveProjectItems
        : activeSectionId === "experiences"
          ? effectiveExperienceItems
          : activeSectionId === "technologies" && batchEditing
            ? (effectiveTechItems as unknown as AdminEntity[])
            : sortedItems,
    [
      activeSectionId,
      effectiveExperienceItems,
      effectiveProjectItems,
      effectiveTechItems,
      batchEditing,
      sortedItems,
    ],
  );

  const selectedItem = useMemo(
    () =>
      displayItems.find((item) => asId(item._id) === selectedItemId) ?? null,
    [displayItems, selectedItemId],
  );

  const sectionTitle =
    activeSectionId === "site-settings"
      ? "Site Settings"
      : activeSectionId === "media"
        ? "Media library"
        : activeSectionId === "inbox"
          ? "Inbox"
          : (activeEntityConfig?.title ?? "Section");
  const sectionDescription =
    activeSectionId === "site-settings"
      ? "Update your identity, profile imagery, and resume."
      : activeSectionId === "media"
        ? "A home for the images and documents behind your portfolio."
        : activeSectionId === "inbox"
          ? "Conversations that start on your portfolio."
          : (activeEntityConfig?.description ?? "");

  const closeInspector = useCallback(() => {
    if (!confirmEditorNavigation()) return;
    setPanelMode("view");
    setSelectedItemId(null);
  }, [setPanelMode, setSelectedItemId]);

  const openCreate = useCallback(() => {
    if (!confirmEditorNavigation()) return;
    setSelectedItemId(null);
    setPanelMode("create");
  }, [setPanelMode, setSelectedItemId]);

  const openView = useCallback(
    (itemId: string) => {
      if (!confirmEditorNavigation()) return;
      setSelectedItemId(itemId);
      setPanelMode("edit");
    },
    [setPanelMode, setSelectedItemId],
  );

  const openEdit = useCallback(
    (itemId: string) => {
      if (!confirmEditorNavigation()) return;
      setSelectedItemId(itemId);
      setPanelMode("edit");
    },
    [setPanelMode, setSelectedItemId],
  );

  const openDelete = useCallback(
    (itemId: string) => {
      if (!confirmEditorNavigation()) return;
      setSelectedItemId(itemId);
      setPanelMode("deleteConfirm");
    },
    [setPanelMode, setSelectedItemId],
  );

  const handleExperienceReorder = useCallback((nextIds: string[]) => {
    setExperienceDraftOrderIds(nextIds);
  }, []);

  const handleExperienceCurrentRoleChange = useCallback(
    (nextCurrentRoleId: string | null) => {
      setExperienceDraftCurrentRoleId(
        nextCurrentRoleId === canonicalCurrentExperienceId
          ? undefined
          : nextCurrentRoleId,
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
      const payload: ReorderItem[] = effectiveExperienceItems.map(
        (item, index) => ({
          id: asId(item._id),
          order: index + 1,
        }),
      );

      const result = await reorderExperiences({
        expectedRevision: bulkRevision.current,
        items: payload.map((item) => ({
          id: item.id as Id<"experiences">,
          order: item.order,
        })),
        currentExperienceId: effectiveCurrentExperienceId
          ? (effectiveCurrentExperienceId as Id<"experiences">)
          : null,
      });

      setExperienceDraftOrderIds(null);
      setExperienceDraftCurrentRoleId(undefined);
      toast({
        title: "Experience layout saved",
        description: `Updated ${result.updatedCount} experiences.`,
      });
    } catch (error) {
      toast({
        title: "Unable to save experience layout",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
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
        expectedRevision: bulkRevision.current,
        items: payload.map((item) => ({
          id: item.id as Id<"projects">,
          order: item.order,
        })),
      });

      setProjectDraftOrderIds(null);
      toast({
        title: "Project order saved",
        description: `Updated ${result.updatedCount} projects.`,
      });
    } catch (error) {
      toast({
        title: "Unable to save project order",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingProjectOrder(false);
    }
  }, [hasProjectOrderChanges, projectDraftOrderIds, reorderProjects, toast]);

  useEffect(() => {
    if (!hasTechChanges && !hasProjectOrderChanges && !hasExperienceChanges)
      bulkRevision.current = publication?.revision ?? 0;
  }, [
    hasTechChanges,
    hasProjectOrderChanges,
    hasExperienceChanges,
    publication?.revision,
  ]);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (hasTechChanges || hasProjectOrderChanges || hasExperienceChanges) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [hasTechChanges, hasProjectOrderChanges, hasExperienceChanges]);

  const isSiteSettingsSection = activeSectionId === "site-settings";
  const desktopInspectorOpen = useMemo(
    () => panelMode !== "view" || selectedItemId !== null,
    [panelMode, selectedItemId],
  );
  const handleSectionChange = useCallback(
    (nextId: SectionId) => {
      if (hasTechChanges) {
        setPendingSectionId(nextId);
        setIsDiscardTechChangesDialogOpen(true);
        return;
      }

      if (!confirmEditorNavigation()) return;
      resetExperienceLayoutDraft();
      resetProjectOrderDraft();
      setReordering(false);
      setBatchEditing(false);
      setActiveSectionId(nextId);
    },
    [
      hasTechChanges,
      setActiveSectionId,
      resetExperienceLayoutDraft,
      resetProjectOrderDraft,
    ],
  );

  useBulkDirty(
    "bulk-editor",
    hasTechChanges || hasProjectOrderChanges || hasExperienceChanges,
  );

  if (!bootstrap) {
    return (
      <div className="min-h-screen bg-background px-6 py-10 text-foreground">
        <div className="container mx-auto">Loading admin dashboard...</div>
      </div>
    );
  }

  const inspectorBody =
    activeSectionId === "site-settings" ? (
      <SiteSettingsInspector
        key={`settings:${panelMode}`}
        revision={publication?.revision ?? 0}
        mode={panelMode}
        settings={data.siteSettings}
        onModeChange={setPanelMode}
        onClose={closeInspector}
        generateUploadUrl={generateUploadUrl}
        resolveStorageUrl={resolveStorageUrl}
      />
    ) : activeEntityConfig ? (
      <EntityInspector
        key={`${activeSectionId}:${selectedItemId}:${panelMode}`}
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
          "group w-full rounded-2xl border p-4 text-left transition-all duration-300",
          selectedItemId
            ? "border-primary/60 bg-primary/5 shadow-lg shadow-primary/10"
            : "border-border/60 bg-background-subtle/30 hover:border-primary/30 hover:bg-background-subtle/60",
        )}
        onClick={() => {
          setSelectedItemId(asId(data.siteSettings?._id ?? "site-settings"));
          setPanelMode("edit");
        }}
      >
        <p className="font-display text-lg text-foreground">
          {asText(data.siteSettings.siteName, "Portfolio Settings")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {asText(data.siteSettings.tagline, "No tagline configured.")}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {data.siteSettings.logoUrl ? "Logo uploaded" : "No logo"}
          </Badge>
          <Badge variant="outline">
            {data.siteSettings.profileImageUrl
              ? "Profile uploaded"
              : "No profile image"}
          </Badge>
          <Badge variant="outline">
            {data.siteSettings.resumeUrl ? "Resume uploaded" : "No resume"}
          </Badge>
        </div>
      </button>
    ) : (
      <EmptyState
        title="No site settings yet"
        description="Create a singleton settings record for your global branding assets."
        onCreate={() => {
          setPanelMode("create");
        }}
      />
    )
  ) : activeEntityConfig ? (
    activeEntityConfig.id === "projects" && reordering ? (
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
    ) : activeEntityConfig.id === "experiences" && reordering ? (
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
    ) : activeEntityConfig.id === "technologies" && batchEditing ? (
      <div className="space-y-4">
        <TechBatchToolbar
          hasChanges={hasTechChanges}
          isSaving={isSavingTechBatch}
          onAdd={addTechDraftItem}
          onSave={() => {
            void saveTechBatch();
          }}
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
        tabs={ADMIN_TABS}
        activeSectionId={activeSectionId}
        onSectionChange={handleSectionChange}
        sectionTitle={sectionTitle}
        sectionDescription={sectionDescription}
        onCreateOrEditSettings={() => {
          setSelectedItemId(
            data.siteSettings ? asId(data.siteSettings._id) : null,
          );
          setPanelMode(data.siteSettings ? "edit" : "create");
        }}
        onCreateItem={openCreate}
        isSiteSettingsSection={isSiteSettingsSection}
        hasSiteSettings={Boolean(data.siteSettings)}
        cardList={
          activeSectionId === "media" ? (
            <MediaLibrary />
          ) : activeSectionId === "inbox" ? (
            <InboxWorkspace />
          ) : (
            <>
              {activeEntityConfig && (
                <div className="admin-toolbar">
                  <input
                    className="admin-search"
                    aria-label="Search this section"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={`Search ${sectionTitle.toLowerCase()}…`}
                    disabled={reordering || batchEditing}
                  />
                  {!reordering &&
                    !batchEditing &&
                    [
                      "projects",
                      "languages",
                      "technologies",
                      "certificates",
                      "about-items",
                    ].includes(activeSectionId) && (
                      <select
                        aria-label="Filter content"
                        value={filter}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            [activeSectionId]: event.target.value,
                          }))
                        }
                      >
                        <option value="">
                          All{" "}
                          {activeSectionId === "projects"
                            ? "statuses"
                            : activeSectionId === "languages"
                              ? "levels"
                              : "groups"}
                        </option>
                        {[
                          ...new Set(
                            displayItems
                              .map((item) =>
                                asText(
                                  activeSectionId === "projects"
                                    ? item.status
                                    : activeSectionId === "languages"
                                      ? item.level
                                      : activeSectionId === "certificates"
                                        ? lookupContext.providerMap.get(
                                            asText(item.providerId),
                                          )?.name
                                        : activeSectionId === "about-items"
                                          ? lookupContext.aboutCategoryMap.get(
                                              asText(item.categoryId),
                                            )?.label
                                          : item.category,
                                ),
                              )
                              .filter(Boolean),
                          ),
                        ].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    )}
                  <span className="text-xs text-muted-foreground">
                    {displayItems.length}{" "}
                    {displayItems.length === 1 ? "item" : "items"}
                  </span>
                  {["projects", "experiences"].includes(activeSectionId) && (
                    <Button
                      className="ml-auto"
                      variant="outline"
                      onClick={() => {
                        resetProjectOrderDraft();
                        resetExperienceLayoutDraft();
                        setReordering(!reordering);
                      }}
                    >
                      {reordering
                        ? "Cancel ordering"
                        : activeSectionId === "experiences"
                          ? "Arrange timeline"
                          : "Reorder"}
                    </Button>
                  )}
                  {activeSectionId === "technologies" && (
                    <Button
                      className="ml-auto"
                      variant="outline"
                      onClick={() => {
                        if (
                          hasTechChanges &&
                          !window.confirm("Discard unsaved batch edits?")
                        )
                          return;
                        resetTechDraft();
                        setBatchEditing(!batchEditing);
                      }}
                    >
                      {batchEditing ? "Close batch editor" : "Edit in bulk"}
                    </Button>
                  )}
                </div>
              )}
              {(search.trim() || filter) &&
              activeEntityConfig &&
              !reordering &&
              !batchEditing
                ? (() => {
                    const items = displayItems.filter((item) => {
                      const text =
                        `${getCardTitle(activeEntityConfig.id, item, lookupContext)} ${getCardSubtitle(activeEntityConfig.id, item, lookupContext)} ${asText(item.description)} ${Array.isArray(item.techStack) ? item.techStack.join(" ") : ""}`.toLowerCase();
                      const group = asText(
                        activeSectionId === "projects"
                          ? item.status
                          : activeSectionId === "languages"
                            ? item.level
                            : activeSectionId === "certificates"
                              ? lookupContext.providerMap.get(
                                  asText(item.providerId),
                                )?.name
                              : activeSectionId === "about-items"
                                ? lookupContext.aboutCategoryMap.get(
                                    asText(item.categoryId),
                                  )?.label
                                : item.category,
                      );
                      return (
                        text.includes(search.trim().toLowerCase()) &&
                        (!filter || filter === group)
                      );
                    });
                    return items.length ? (
                      <SectionCardGrid
                        config={activeEntityConfig}
                        items={items}
                        selectedItemId={selectedItemId}
                        context={lookupContext}
                        onCreate={openCreate}
                        onOpen={openView}
                        onEdit={openEdit}
                        onDelete={openDelete}
                      />
                    ) : (
                      <div className="admin-empty">
                        <h2>No matching content</h2>
                        <p className="text-muted-foreground mt-2">
                          Try another search or clear your filters.
                        </p>
                        <Button
                          className="mt-4"
                          variant="outline"
                          onClick={() => {
                            setSearch("");
                            setFilters((current) => ({
                              ...current,
                              [activeSectionId]: "",
                            }));
                          }}
                        >
                          Clear filters
                        </Button>
                      </div>
                    );
                  })()
                : cardList}
            </>
          )
        }
        inspector={
          <Dialog
            open={desktopInspectorOpen && Boolean(inspectorBody)}
            onOpenChange={(open) => {
              if (!open) closeInspector();
            }}
          >
            <DialogContent
              className="admin-workspace admin-editor-dialog"
              onInteractOutside={(event) => event.preventDefault()}
            >
              <DialogHeader className="sr-only">
                <DialogTitle>{sectionTitle} editor</DialogTitle>
                <DialogDescription>
                  Edit saved draft content. Publish separately to update the
                  live site.
                </DialogDescription>
              </DialogHeader>
              <div className="admin-editor-scroll">{inspectorBody}</div>
            </DialogContent>
          </Dialog>
        }
      />

      <Dialog
        open={isDiscardTechChangesDialogOpen}
        onOpenChange={(open) => {
          setIsDiscardTechChangesDialogOpen(open);
          if (!open) {
            setPendingSectionId(null);
          }
        }}
      >
        <DialogContent className="admin-workspace">
          <DialogHeader>
            <DialogTitle>Discard unsaved technology changes?</DialogTitle>
            <DialogDescription>
              You have unsaved edits in Technologies. Switching sections now
              will discard those changes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={cancelDiscardTechDraftDialog}
            >
              Keep editing
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDiscardTechDraftAndSwitchSection}
            >
              Discard and switch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
