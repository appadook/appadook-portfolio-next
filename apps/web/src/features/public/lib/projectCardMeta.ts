import type { Project } from '@/features/public/types';

type ProjectBadgeTone = 'danger' | 'success' | 'brand' | 'neutral';

export type ProjectCardBadge = {
  key: 'deprecated' | 'new';
  label: string;
  tone: ProjectBadgeTone;
};

export type ProjectCardLink = {
  key: 'github' | 'live';
  label: string;
  href: string;
};

const MAX_BADGES_PER_CARD = 2;

function normalizeExternalUrl(url?: string): string | null {
  if (!url) {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    return parsed.toString();
  } catch {
    return null;
  }
}

export function getProjectCardMeta(
  project: Project,
): { badges: ProjectCardBadge[]; links: ProjectCardLink[] } {
  const githubUrl = normalizeExternalUrl(project.githubUrl);
  const liveUrl = normalizeExternalUrl(project.liveUrl);
  const isDeprecated = project.status === 'deprecated';
  const isNew = project.status === 'new';

  const badges: ProjectCardBadge[] = [];
  const links: ProjectCardLink[] = [];

  if (isDeprecated) {
    badges.push({ key: 'deprecated', label: 'Deprecated', tone: 'danger' });
  }

  if (isNew) {
    badges.push({ key: 'new', label: 'New', tone: 'success' });
  }

  if (liveUrl) {
    links.push({ key: 'live', label: 'Live site', href: liveUrl });
  }

  if (githubUrl) {
    links.push({ key: 'github', label: 'GitHub', href: githubUrl });
  }

  return {
    badges: badges.slice(0, MAX_BADGES_PER_CARD),
    links,
  };
}
