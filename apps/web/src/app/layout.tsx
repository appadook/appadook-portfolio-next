import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/app/providers';

const metadataBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseUrl),
  title: 'Kurtik Appadoo - Portfolio',
  description: 'Kurtik Appadoo portfolio with projects, experience, and contact.',
  icons: {
    icon: '/ka-logo-final.svg',
    shortcut: '/ka-logo-final.svg',
    apple: '/ka-logo-final.svg',
  },
  openGraph: {
    images: ['/ka-logo-final.svg'],
  },
  twitter: {
    images: ['/ka-logo-final.svg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
