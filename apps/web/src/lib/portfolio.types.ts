export interface Experience {
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
}

export interface Project {
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
}

export interface ProgrammingLanguage {
  _id: string;
  name: string;
  level: 'expert' | 'advanced' | 'intermediate';
  description: string;
  logoUrl?: string;
  order: number;
}

export interface Technology {
  _id: string;
  name: string;
  category:
    | 'Frontend'
    | 'Backend'
    | 'Database'
    | 'Mobile'
    | 'Testing & QA'
    | 'DevOps'
    | string;
  description?: string;
  iconName?: string;
  iconUrl?: string;
  order: number;
}

export interface Certificate {
  _id: string;
  name: string;
  providerId?: string;
  image: string;
  year: string;
  description?: string;
  issuer?: string;
  credentialId?: string;
  verificationUrl?: string;
  skills?: string[];
  order: number;
}

export interface CloudProvider {
  _id: string;
  name: string;
  iconName?: string;
  iconUrl?: string;
  order: number;
  certificates?: Certificate[];
}

export interface SiteSettings {
  _id?: string;
  siteName?: string;
  tagline?: string;
  logo?: {
    asset: {
      _ref: string;
      url?: string;
    };
  };
  profileImage?: {
    asset: {
      _ref: string;
      url?: string;
    };
  };
  resume?: {
    asset: {
      _ref: string;
      url?: string;
    };
  };
}

export interface AboutCategory {
  _id: string;
  name: string;
  label: string;
  color: string;
  icon: string;
  order: number;
}

export interface AboutItem {
  _id: string;
  category: AboutCategory;
  title: string;
  subtitle?: string;
  description?: string;
  date?: string;
  details?: string[];
  icon: string;
  image?: string;
  order: number;
}

export interface PortfolioSnapshot {
  siteSettings: SiteSettings;
  experiences: Experience[];
  projects: Project[];
  programmingLanguages: ProgrammingLanguage[];
  technologies: Technology[];
  cloudProviders: CloudProvider[];
  aboutCategories: AboutCategory[];
  aboutItems: AboutItem[];
}
