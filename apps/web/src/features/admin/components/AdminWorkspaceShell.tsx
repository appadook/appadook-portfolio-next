'use client';
import { Button } from '@/components/ui/button';
import type { AdminUser, SectionId } from '../types';
import { authClient } from '@/lib/auth-client';
import {
  BriefcaseBusiness,
  FolderOpen,
  UserRound,
  Code2,
  Award,
  ImageIcon,
  Inbox,
  Settings2,
  ArrowUpRight,
  LogOut,
  Menu,
  X,
  Plus,
  Pencil,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect, type ReactNode } from 'react';
import { confirmEditorNavigation } from '../hooks/useEditorDraft';
import { PublishingControls } from './PublishingControls';
import './admin-workspace.css';

export type AdminWorkspaceShellProps = {
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
};
const contentNav = [
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'experiences', label: 'Experience', icon: BriefcaseBusiness },
  {
    id: 'about-items',
    label: 'About',
    icon: UserRound,
    children: ['about-items', 'about-categories'],
  },
  {
    id: 'languages',
    label: 'Skills',
    icon: Code2,
    children: ['languages', 'technologies'],
  },
  {
    id: 'certificates',
    label: 'Certifications',
    icon: Award,
    children: ['certificates', 'providers'],
  },
] as const;
const workspaceNav = [
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'site-settings', label: 'Site settings', icon: Settings2 },
] as const;
export const singularNames: Record<string, string> = {
  projects: 'project',
  experiences: 'experience',
  languages: 'language',
  technologies: 'technology',
  certificates: 'certificate',
  providers: 'provider',
  'about-items': 'about item',
  'about-categories': 'category',
};
const subnav: Record<string, Array<[SectionId, string]>> = {
  'about-items': [
    ['about-items', 'Timeline items'],
    ['about-categories', 'Categories'],
  ],
  languages: [
    ['languages', 'Languages'],
    ['technologies', 'Technologies'],
  ],
  certificates: [
    ['certificates', 'Certificates'],
    ['providers', 'Providers'],
  ],
};
export function AdminWorkspaceShell(props: AdminWorkspaceShellProps) {
  const {
    user,
    activeSectionId,
    onSectionChange,
    sectionTitle,
    sectionDescription,
    isSiteSettingsSection,
    hasSiteSettings,
    cardList,
    inspector,
  } = props;
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menu) return;
    const sidebar = sidebarRef.current;
    const toggle = toggleRef.current;
    const focusable = () => [
      ...(sidebar?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href]',
      ) ?? []),
    ];
    focusable()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenu(false);
      }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      const first = elements[0],
        last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      toggle?.focus();
    };
  }, [menu]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState('');
  const activeGroup = contentNav.find(
    (item) =>
      item.id === activeSectionId ||
      ('children' in item &&
        (item.children as readonly string[]).includes(activeSectionId)),
  );
  const subitems = activeGroup ? subnav[activeGroup.id] : undefined;
  const navigate = (id: SectionId) => {
    onSectionChange(id);
    setMenu(false);
  };
  return (
    <div className="admin-workspace min-h-screen">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-3"
      >
        Skip to content
      </a>
      {menu && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setMenu(false)}
        />
      )}
      <aside
        ref={sidebarRef}
        className="admin-sidebar"
        data-open={menu}
        role={menu ? 'dialog' : undefined}
        aria-modal={menu || undefined}
        aria-label="Workspace navigation"
      >
        <div className="admin-brand">
          <span className="admin-monogram">KA</span>
          <div>
            Portfolio
            <span className="block text-[11px] font-normal tracking-wide text-muted-foreground">
              EDITOR WORKSPACE
            </span>
          </div>
        </div>
        <nav aria-label="Workspace sections" className="flex-1 overflow-y-auto">
          <p className="admin-nav-label">Content</p>
          {contentNav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className="admin-nav-link"
              aria-current={activeGroup?.id === id ? 'page' : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={17} strokeWidth={1.6} />
              {label}
            </button>
          ))}
          <p className="admin-nav-label !mt-8">Workspace</p>
          {workspaceNav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className="admin-nav-link"
              aria-current={activeSectionId === id ? 'page' : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={17} strokeWidth={1.6} />
              {label}
            </button>
          ))}
        </nav>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="admin-nav-link mt-8"
        >
          View live site
          <ArrowUpRight size={16} className="ml-auto" />
        </a>
        <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 px-2">
          <span className="admin-monogram shrink-0">KA</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium">appadook</p>
            <p
              className="truncate text-[11px] text-muted-foreground"
              title={user.email}
            >
              Portfolio owner
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            disabled={isLoggingOut}
            onClick={async () => {
              if (!confirmEditorNavigation()) return;
              setIsLoggingOut(true);
              try {
                const result = await authClient.signOut();
                if (result.error) throw Error();
                try {
                  for (const key of Object.keys(sessionStorage))
                    if (key.startsWith('portfolio-editor:'))
                      sessionStorage.removeItem(key);
                } catch {
                  /* Storage may be unavailable. */
                }
                router.push('/admin/login');
                router.refresh();
              } catch {
                setError('Sign out failed. Try again.');
              } finally {
                setIsLoggingOut(false);
              }
            }}
          >
            <LogOut size={16} />
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="md:hidden p-1"
            ref={toggleRef}
            aria-label="Toggle navigation"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span className="hidden text-xs text-muted-foreground lg:block">
            Workspace <span className="px-2 opacity-40">/</span>{' '}
            {activeGroup?.label ?? sectionTitle}
          </span>
          <PublishingControls onNavigate={navigate} />
        </header>
        <main id="admin-content" className="admin-content">
          <div className="admin-heading">
            <div>
              <h1>{sectionTitle}</h1>
              <p>{sectionDescription}</p>
            </div>
            {!['media', 'inbox'].includes(activeSectionId) && (
              <Button
                onClick={
                  isSiteSettingsSection
                    ? props.onCreateOrEditSettings
                    : props.onCreateItem
                }
                className="shrink-0"
              >
                {isSiteSettingsSection ? (
                  <Pencil size={15} className="mr-2" />
                ) : (
                  <Plus size={16} className="mr-2" />
                )}{' '}
                {isSiteSettingsSection
                  ? hasSiteSettings
                    ? 'Edit settings'
                    : 'Set up site'
                  : `New ${singularNames[activeSectionId]}`}
              </Button>
            )}
          </div>
          {subitems && (
            <nav
              className="admin-subnav"
              aria-label={`${activeGroup?.label} sections`}
            >
              {subitems.map(([id, label]) => (
                <button
                  key={id}
                  aria-current={activeSectionId === id ? 'page' : undefined}
                  onClick={() => navigate(id)}
                >
                  {label}
                </button>
              ))}
            </nav>
          )}
          {cardList}
        </main>
      </div>
      {inspector}
    </div>
  );
}
