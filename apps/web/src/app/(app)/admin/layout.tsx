import type { CSSProperties, ReactNode } from 'react';

const adminFontVars: CSSProperties = {
  ['--font-admin-display' as string]: '"Bebas Neue", "Arial Narrow", "Impact", sans-serif',
  ['--font-admin-mono' as string]:
    '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-font-scope" style={adminFontVars}>
      {children}
    </div>
  );
}
