import type { Metadata, Viewport } from 'next';
import './globals.css';

const metadataBaseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseUrl),
  title: 'Kurtik Appadoo - Portfolio',
  description:
    'Kurtik Appadoo portfolio with projects, experience, and contact.',
  icons: {
    icon: '/ka-logo-final.svg',
    shortcut: '/ka-logo-final.svg',
    apple: '/ka-logo-final.svg',
  },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    title: 'Kurtik Appadoo — Portfolio',
    description:
      'Software, data, and research. Explore projects and experience.',
  },
  twitter: { card: 'summary_large_image', images: ['/opengraph-image'] },
};

export const viewport: Viewport = { themeColor: '#101014' };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
