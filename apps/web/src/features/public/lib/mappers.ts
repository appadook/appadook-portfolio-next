import type {
  AboutCategory,
  AboutItem,
  CloudProvider,
  ProgrammingLanguage,
  Project,
  SiteSettings,
  Technology,
  Experience,
} from '@/features/public/types';

export type ExperiencePayload = {
  _id: string;
  company: string;
  role: string;
  duration: string;
  location: string;
  description: string;
  technologies: string[];
  logo?: string;
  isCurrent?: boolean;
  order: number;
};

export type ProjectPayload = {
  _id: string;
  _creationTime?: number;
  title: string;
  description: string;
  longDescription?: string;
  categories: string[];
  techStack: string[];
  status?: 'new' | 'active' | 'deprecated';
  githubUrl?: string;
  liveUrl?: string;
  image?: string;
  features?: string[];
  challenges?: string[];
  outcomes?: string[];
  timeline?: string;
  teamSize?: string;
  order: number;
};

export type ProgrammingLanguagePayload = {
  _id: string;
  name: string;
  level: ProgrammingLanguage['level'];
  description: string;
  logoUrl?: string;
  order: number;
};

export type TechnologyPayload = {
  _id: string;
  name: string;
  category: string;
  description?: string;
  iconName?: string;
  iconUrl?: string;
  order: number;
};

export type CertificatePayload = {
  _id: string;
  name: string;
  image: string;
  year: string;
  description?: string;
  issuer?: string;
  credentialId?: string;
  verificationUrl?: string;
  skills?: string[];
  order: number;
  providerId?: string;
};

export type CloudProviderPayload = {
  _id: string;
  name: string;
  iconName?: string;
  iconUrl?: string;
  order: number;
  certificates: CertificatePayload[];
};

export type AboutCategoryPayload = {
  _id: string;
  name: string;
  label: string;
  color: string;
  icon: string;
  order: number;
};

export type AboutItemPayload = {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  date?: string;
  details?: string[];
  icon: string;
  image?: string;
  order: number;
  category: AboutCategoryPayload;
};

export type SiteSettingsPayload = {
  _id?: string;
  siteName?: string;
  tagline?: string;
  logoUrl?: string;
  profileImageUrl?: string;
  resumeUrl?: string;
};

export const mapExperience = (item: ExperiencePayload): Experience => ({
  _id: String(item._id),
  company: item.company,
  role: item.role,
  duration: item.duration,
  location: item.location,
  description: item.description,
  technologies: item.technologies || [],
  logo: item.logo,
  isCurrent: item.isCurrent,
  order: item.order ?? 0,
});

export const mapProject = (item: ProjectPayload): Project => ({
  _id: String(item._id),
  _creationTime: item._creationTime,
  title: item.title,
  description: item.description,
  longDescription: item.longDescription,
  categories: item.categories || [],
  techStack: item.techStack || [],
  status: item.status,
  githubUrl: item.githubUrl,
  liveUrl: item.liveUrl,
  image: item.image,
  features: item.features,
  challenges: item.challenges,
  outcomes: item.outcomes,
  timeline: item.timeline,
  teamSize: item.teamSize,
  order: item.order ?? 0,
});

export const mapProgrammingLanguage = (
  item: ProgrammingLanguagePayload,
): ProgrammingLanguage => ({
  _id: String(item._id),
  name: item.name,
  level: item.level,
  description: item.description,
  logoUrl: item.logoUrl,
  order: item.order ?? 0,
});

export const mapTechnology = (item: TechnologyPayload): Technology => ({
  _id: String(item._id),
  name: item.name,
  category: item.category,
  description: item.description,
  iconName: item.iconName,
  iconUrl: item.iconUrl,
  order: item.order ?? 0,
});

export const mapCloudProvider = (item: CloudProviderPayload): CloudProvider => ({
  _id: String(item._id),
  name: item.name,
  iconName: item.iconName,
  iconUrl: item.iconUrl,
  order: item.order ?? 0,
  certificates: (item.certificates || []).map((certificate) => ({
    _id: String(certificate._id),
    name: certificate.name,
    image: certificate.image,
    year: certificate.year,
    description: certificate.description,
    issuer: certificate.issuer,
    credentialId: certificate.credentialId,
    verificationUrl: certificate.verificationUrl,
    skills: certificate.skills,
    order: certificate.order ?? 0,
    providerId: String(certificate.providerId ?? ''),
  })),
});

export const mapAboutCategory = (item: AboutCategoryPayload): AboutCategory => ({
  _id: String(item._id),
  name: item.name,
  label: item.label,
  color: item.color,
  icon: item.icon,
  order: item.order ?? 0,
});

export const mapAboutItem = (item: AboutItemPayload): AboutItem => ({
  _id: String(item._id),
  title: item.title,
  subtitle: item.subtitle,
  description: item.description,
  date: item.date,
  details: item.details,
  icon: item.icon,
  image: item.image,
  order: item.order ?? 0,
  category: mapAboutCategory(item.category),
});

export const mapSiteSettings = (raw: SiteSettingsPayload): SiteSettings => ({
  _id: String(raw._id ?? 'site-settings'),
  siteName: raw.siteName,
  tagline: raw.tagline,
  logo: {
    asset: {
      _ref: 'site-logo',
      url: raw.logoUrl,
    },
  },
  profileImage: {
    asset: {
      _ref: 'site-profile',
      url: raw.profileImageUrl,
    },
  },
  resume: {
    asset: {
      _ref: 'site-resume',
      url: raw.resumeUrl,
    },
  },
});

export function isPresent<T>(value: T | null | undefined): value is T {
  return value != null;
}
