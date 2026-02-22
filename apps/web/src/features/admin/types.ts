import type { FunctionReference } from 'convex/server';

export type AdminUser = {
  id: string;
  email?: string;
};

export type AdminEntity = {
  _id: string;
  order?: number;
  [key: string]: unknown;
};

export type SiteSettingsEntity = {
  _id: string;
  siteName?: string;
  tagline?: string;
  logoUrl?: string;
  profileImageUrl?: string;
  resumeUrl?: string;
} | null;

export type BootstrapData = {
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

export type EntitySectionId =
  | 'experiences'
  | 'projects'
  | 'languages'
  | 'technologies'
  | 'providers'
  | 'certificates'
  | 'about-categories'
  | 'about-items';

export type SectionId = 'site-settings' | EntitySectionId;

export type SelectOption = {
  label: string;
  value: string;
};

export type FieldType = 'text' | 'textarea' | 'number' | 'csv' | 'list' | 'select' | 'icon-picker';

export type FormFieldConfig = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: SelectOption[];
};

export type MediaFieldConfig = {
  key: string;
  label: string;
  kind: 'image' | 'logo' | 'resumePdf';
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
