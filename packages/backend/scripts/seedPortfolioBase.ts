import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';

type SeedSiteSettings = {
  siteName?: string;
  tagline?: string;
};

type SeedExperience = {
  company: string;
  role: string;
  duration: string;
  location: string;
  description: string;
  technologies: string[];
  order: number;
};

type SeedProject = {
  title: string;
  description: string;
  longDescription?: string;
  categories: string[];
  techStack: string[];
  features?: string[];
  challenges?: string[];
  outcomes?: string[];
  timeline?: string;
  teamSize?: string;
  order: number;
};

type SeedProgrammingLanguage = {
  name: string;
  level: 'expert' | 'advanced' | 'intermediate';
  description: string;
  logoUrl?: string;
  order: number;
};

type SeedTechnology = {
  name: string;
  category: string;
  order: number;
};

type SeedCloudProvider = {
  key: string;
  name: string;
  order: number;
};

type SeedCertificate = {
  providerKey: string;
  name: string;
  image: string;
  year: string;
  description?: string;
  issuer?: string;
  credentialId?: string;
  skills?: string[];
  order: number;
};

type SeedAboutCategory = {
  key: string;
  name: string;
  label: string;
  color: string;
  icon: string;
  order: number;
};

type SeedAboutItem = {
  categoryKey: string;
  title: string;
  subtitle?: string;
  description?: string;
  date?: string;
  details?: string[];
  icon: string;
  order: number;
};

type SeedPayload = {
  metadata?: Record<string, unknown>;
  siteSettings?: SeedSiteSettings;
  experiences: SeedExperience[];
  projects: SeedProject[];
  programmingLanguages: SeedProgrammingLanguage[];
  technologies: SeedTechnology[];
  cloudProviders: SeedCloudProvider[];
  certificates: SeedCertificate[];
  aboutCategories: SeedAboutCategory[];
  aboutItems: SeedAboutItem[];
};

type AdminBootstrap = {
  siteSettings: { _id: Id<'siteSettings'> } | null;
  experiences: Array<{ version?: number; _id: Id<'experiences'> }>;
  projects: Array<{ version?: number; _id: Id<'projects'> }>;
  programmingLanguages: Array<{
    version?: number;
    _id: Id<'programmingLanguages'>;
  }>;
  technologies: Array<{ version?: number; _id: Id<'technologies'> }>;
  cloudProviders: Array<{ version?: number; _id: Id<'cloudProviders'> }>;
  certificates: Array<{ version?: number; _id: Id<'certificates'> }>;
  aboutCategories: Array<{ version?: number; _id: Id<'aboutCategories'> }>;
  aboutItems: Array<{ version?: number; _id: Id<'aboutItems'> }>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {};
  }

  const content = readFileSync(filePath, 'utf8');
  const output: Record<string, string> = {};

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const idx = line.indexOf('=');
    if (idx <= 0) {
      continue;
    }

    const key = line.slice(0, idx).trim();
    const value = line
      .slice(idx + 1)
      .trim()
      .replace(/^"|"$/g, '');
    if (key) {
      output[key] = value;
    }
  }

  return output;
}

function resolveConvexUrl(): string {
  if (process.env.CONVEX_URL) {
    return process.env.CONVEX_URL;
  }

  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    return process.env.NEXT_PUBLIC_CONVEX_URL;
  }

  const projectRoot = resolve(__dirname, '..', '..');
  const candidateEnvFiles = [
    resolve(__dirname, '..', '.env.local'),
    resolve(projectRoot, '.env.local'),
    resolve(projectRoot, 'apps', 'web', '.env.local'),
  ];

  for (const filePath of candidateEnvFiles) {
    const parsed = parseEnvFile(filePath);
    if (parsed.CONVEX_URL) {
      return parsed.CONVEX_URL;
    }
    if (parsed.NEXT_PUBLIC_CONVEX_URL) {
      return parsed.NEXT_PUBLIC_CONVEX_URL;
    }
  }

  throw new Error(
    'Missing Convex URL. Set CONVEX_URL or NEXT_PUBLIC_CONVEX_URL in your environment.',
  );
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Seed validation failed: ${message}`);
  }
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === 'string')
  );
}

function validateSeed(seed: SeedPayload) {
  assert(Array.isArray(seed.experiences), '`experiences` must be an array');
  assert(Array.isArray(seed.projects), '`projects` must be an array');
  assert(
    Array.isArray(seed.programmingLanguages),
    '`programmingLanguages` must be an array',
  );
  assert(Array.isArray(seed.technologies), '`technologies` must be an array');
  assert(
    Array.isArray(seed.cloudProviders),
    '`cloudProviders` must be an array',
  );
  assert(Array.isArray(seed.certificates), '`certificates` must be an array');
  assert(
    Array.isArray(seed.aboutCategories),
    '`aboutCategories` must be an array',
  );
  assert(Array.isArray(seed.aboutItems), '`aboutItems` must be an array');

  const providerKeys = new Set(
    seed.cloudProviders.map((provider) => provider.key),
  );
  const categoryKeys = new Set(
    seed.aboutCategories.map((category) => category.key),
  );

  for (const language of seed.programmingLanguages) {
    assert(
      language.level === 'expert' ||
        language.level === 'advanced' ||
        language.level === 'intermediate',
      `invalid language level for ${language.name}`,
    );
  }

  for (const experience of seed.experiences) {
    assert(
      typeof experience.company === 'string' && experience.company.length > 0,
      'experience.company is required',
    );
    assert(
      typeof experience.role === 'string' && experience.role.length > 0,
      'experience.role is required',
    );
    assert(
      typeof experience.duration === 'string' && experience.duration.length > 0,
      'experience.duration is required',
    );
    assert(
      typeof experience.location === 'string' && experience.location.length > 0,
      'experience.location is required',
    );
    assert(
      typeof experience.description === 'string' &&
        experience.description.length > 0,
      'experience.description is required',
    );
    assert(
      isStringArray(experience.technologies),
      'experience.technologies must be a string array',
    );
    assert(
      Number.isFinite(experience.order),
      'experience.order must be a number',
    );
  }

  for (const project of seed.projects) {
    assert(
      typeof project.title === 'string' && project.title.length > 0,
      'project.title is required',
    );
    assert(
      typeof project.description === 'string' && project.description.length > 0,
      'project.description is required',
    );
    assert(
      isStringArray(project.categories),
      `project.categories must be string[] (${project.title})`,
    );
    assert(
      isStringArray(project.techStack),
      `project.techStack must be string[] (${project.title})`,
    );
    assert(
      Number.isFinite(project.order),
      `project.order must be a number (${project.title})`,
    );
  }

  for (const technology of seed.technologies) {
    assert(
      typeof technology.name === 'string' && technology.name.length > 0,
      'technology.name is required',
    );
    assert(
      typeof technology.category === 'string' && technology.category.length > 0,
      'technology.category is required',
    );
    assert(
      Number.isFinite(technology.order),
      `technology.order must be a number (${technology.name})`,
    );
  }

  for (const provider of seed.cloudProviders) {
    assert(
      typeof provider.key === 'string' && provider.key.length > 0,
      'provider.key is required',
    );
    assert(
      typeof provider.name === 'string' && provider.name.length > 0,
      'provider.name is required',
    );
    assert(
      Number.isFinite(provider.order),
      `provider.order must be a number (${provider.name})`,
    );
  }

  for (const certificate of seed.certificates) {
    assert(
      typeof certificate.providerKey === 'string' &&
        providerKeys.has(certificate.providerKey),
      `certificate.providerKey must match cloudProviders.key (${certificate.name})`,
    );
    assert(
      typeof certificate.name === 'string' && certificate.name.length > 0,
      'certificate.name is required',
    );
    assert(
      typeof certificate.image === 'string',
      `certificate.image must be a string (${certificate.name})`,
    );
    assert(
      typeof certificate.year === 'string' && certificate.year.length > 0,
      `certificate.year is required (${certificate.name})`,
    );
    if (certificate.skills !== undefined) {
      assert(
        isStringArray(certificate.skills),
        `certificate.skills must be string[] (${certificate.name})`,
      );
    }
    assert(
      Number.isFinite(certificate.order),
      `certificate.order must be a number (${certificate.name})`,
    );
  }

  for (const category of seed.aboutCategories) {
    assert(
      typeof category.key === 'string' && category.key.length > 0,
      'aboutCategory.key is required',
    );
    assert(
      typeof category.name === 'string' && category.name.length > 0,
      'aboutCategory.name is required',
    );
    assert(
      typeof category.label === 'string' && category.label.length > 0,
      'aboutCategory.label is required',
    );
    assert(
      typeof category.color === 'string' && category.color.length > 0,
      'aboutCategory.color is required',
    );
    assert(
      typeof category.icon === 'string' && category.icon.length > 0,
      'aboutCategory.icon is required',
    );
    assert(
      Number.isFinite(category.order),
      `aboutCategory.order must be a number (${category.key})`,
    );
  }

  for (const item of seed.aboutItems) {
    assert(
      typeof item.categoryKey === 'string' &&
        categoryKeys.has(item.categoryKey),
      `aboutItem.categoryKey must match aboutCategories.key (${item.title})`,
    );
    assert(
      typeof item.title === 'string' && item.title.length > 0,
      'aboutItem.title is required',
    );
    assert(
      typeof item.icon === 'string' && item.icon.length > 0,
      `aboutItem.icon is required (${item.title})`,
    );
    if (item.details !== undefined) {
      assert(
        isStringArray(item.details),
        `aboutItem.details must be string[] (${item.title})`,
      );
    }
    assert(
      Number.isFinite(item.order),
      `aboutItem.order must be a number (${item.title})`,
    );
  }
}

function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

function readSeed(seedPath: string): SeedPayload {
  const raw = readFileSync(seedPath, 'utf8');
  return JSON.parse(raw) as SeedPayload;
}

function countExisting(bootstrap: AdminBootstrap): number {
  return (
    (bootstrap.siteSettings ? 1 : 0) +
    bootstrap.experiences.length +
    bootstrap.projects.length +
    bootstrap.programmingLanguages.length +
    bootstrap.technologies.length +
    bootstrap.cloudProviders.length +
    bootstrap.certificates.length +
    bootstrap.aboutCategories.length +
    bootstrap.aboutItems.length
  );
}

async function clearExistingData(
  client: ConvexHttpClient,
  bootstrap: AdminBootstrap,
) {
  for (const item of bootstrap.aboutItems) {
    await client.mutation(api.admin.deleteAboutItem, {
      id: item._id,
      expectedVersion: item.version ?? 0,
    });
  }

  for (const item of bootstrap.certificates) {
    await client.mutation(api.admin.deleteCertificate, {
      id: item._id,
      expectedVersion: item.version ?? 0,
    });
  }

  for (const item of bootstrap.aboutCategories) {
    await client.mutation(api.admin.deleteAboutCategory, {
      id: item._id,
      expectedVersion: item.version ?? 0,
    });
  }

  for (const item of bootstrap.cloudProviders) {
    await client.mutation(api.admin.deleteCloudProvider, {
      id: item._id,
      expectedVersion: item.version ?? 0,
    });
  }

  for (const item of bootstrap.technologies) {
    await client.mutation(api.admin.deleteTechnology, {
      id: item._id,
      expectedVersion: item.version ?? 0,
    });
  }

  for (const item of bootstrap.programmingLanguages) {
    await client.mutation(api.admin.deleteProgrammingLanguage, {
      id: item._id,
      expectedVersion: item.version ?? 0,
    });
  }

  for (const item of bootstrap.projects) {
    await client.mutation(api.admin.deleteProject, {
      id: item._id,
      expectedVersion: item.version ?? 0,
    });
  }

  for (const item of bootstrap.experiences) {
    await client.mutation(api.admin.deleteExperience, {
      id: item._id,
      expectedVersion: item.version ?? 0,
    });
  }
}

async function seedPortfolioData(client: ConvexHttpClient, seed: SeedPayload) {
  const publication = await client.query(api.publishing.status, {});
  await client.mutation(api.admin.upsertSiteSettings, {
    expectedRevision: publication.revision,
    siteName: seed.siteSettings?.siteName,
    tagline: seed.siteSettings?.tagline,
  });

  for (const experience of sortByOrder(seed.experiences)) {
    await client.mutation(api.admin.createExperience, experience);
  }

  for (const project of sortByOrder(seed.projects)) {
    await client.mutation(api.admin.createProject, project);
  }

  for (const language of sortByOrder(seed.programmingLanguages)) {
    await client.mutation(api.admin.createProgrammingLanguage, language);
  }

  for (const technology of sortByOrder(seed.technologies)) {
    await client.mutation(api.admin.createTechnology, technology);
  }

  const providerIdByKey = new Map<string, Id<'cloudProviders'>>();

  for (const provider of sortByOrder(seed.cloudProviders)) {
    const providerId = await client.mutation(api.admin.createCloudProvider, {
      name: provider.name,
      order: provider.order,
    });
    providerIdByKey.set(provider.key, providerId);
  }

  for (const certificate of sortByOrder(seed.certificates)) {
    const providerId = providerIdByKey.get(certificate.providerKey);
    if (!providerId) {
      throw new Error(
        `Missing provider id for certificate providerKey: ${certificate.providerKey}`,
      );
    }

    await client.mutation(api.admin.createCertificate, {
      name: certificate.name,
      providerId,
      image: certificate.image,
      year: certificate.year,
      description: certificate.description,
      issuer: certificate.issuer,
      credentialId: certificate.credentialId,
      skills: certificate.skills,
      order: certificate.order,
    });
  }

  const categoryIdByKey = new Map<string, Id<'aboutCategories'>>();

  for (const category of sortByOrder(seed.aboutCategories)) {
    const categoryId = await client.mutation(api.admin.createAboutCategory, {
      name: category.name,
      label: category.label,
      color: category.color,
      icon: category.icon,
      order: category.order,
    });
    categoryIdByKey.set(category.key, categoryId);
  }

  for (const item of sortByOrder(seed.aboutItems)) {
    const categoryId = categoryIdByKey.get(item.categoryKey);
    if (!categoryId) {
      throw new Error(
        `Missing category id for aboutItem categoryKey: ${item.categoryKey}`,
      );
    }

    await client.mutation(api.admin.createAboutItem, {
      categoryId,
      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      date: item.date,
      details: item.details,
      icon: item.icon,
      order: item.order,
    });
  }
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const shouldReset = args.has('--reset');
  const forceAppend = args.has('--force');
  const validateOnly = args.has('--validate-only');

  const seedPath = resolve(
    __dirname,
    '..',
    'convex',
    'seeds',
    'portfolio-base-no-media.json',
  );
  const seed = readSeed(seedPath);
  validateSeed(seed);

  if (validateOnly) {
    console.log('Seed file validated successfully.');
    console.log({
      experiences: seed.experiences.length,
      projects: seed.projects.length,
      programmingLanguages: seed.programmingLanguages.length,
      technologies: seed.technologies.length,
      cloudProviders: seed.cloudProviders.length,
      certificates: seed.certificates.length,
      aboutCategories: seed.aboutCategories.length,
      aboutItems: seed.aboutItems.length,
    });
    return;
  }

  const convexUrl = resolveConvexUrl();
  const client = new ConvexHttpClient(convexUrl);
  const token = process.env.PORTFOLIO_OWNER_TOKEN;
  if (!token)
    throw new Error(
      'PORTFOLIO_OWNER_TOKEN is required. Use a short-lived token from the authenticated owner session.',
    );
  client.setAuth(token);

  const bootstrap = (await client.query(
    api.admin.getAdminBootstrap,
    {},
  )) as AdminBootstrap;
  const existingCount = countExisting(bootstrap);

  if (existingCount > 0 && !shouldReset && !forceAppend) {
    throw new Error(
      `Existing admin data detected (${existingCount} records). Re-run with --reset to replace, or --force to append.`,
    );
  }

  if (shouldReset && existingCount > 0) {
    console.log(
      `Reset requested. Deleting ${existingCount} existing records...`,
    );
    await clearExistingData(client, bootstrap);
    console.log('Existing records removed.');
  }

  console.log('Seeding Convex admin data...');
  await seedPortfolioData(client, seed);
  console.log('Seed complete.');
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
