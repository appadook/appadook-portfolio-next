'use client';

import { type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Pencil, Plus } from 'lucide-react';
import { auth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { AdminUser, SectionId } from '@/features/admin/types';

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

export function AdminWorkspaceShell({
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
}: AdminWorkspaceShellProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary/80">Admin</p>
            <h1 className="font-display text-3xl">Portfolio Control Center</h1>
            <p className="text-sm text-muted-foreground">Signed in as {user.email ?? 'Unknown user'}</p>
          </div>
          <Button
            variant="outline"
            className="border-border/60 hover:border-primary/50"
            onClick={async () => {
              try {
                await auth.client.logout();
              } catch (error) {
                console.error('WAY Auth logout failed:', error);
              } finally {
                router.push('/admin/login');
                router.refresh();
              }
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
                aria-current={activeSectionId === tab.id ? 'page' : undefined}
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
            {inspector}
          </div>
        </div>
      </div>
    </div>
  );
}
