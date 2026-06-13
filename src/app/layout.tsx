import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { PWARegister } from '@/components/PWARegister';

export const metadata: Metadata = {
  title: 'Chocotto — ちょこっと集まる',
  description:
    '今日ふらっと、目的だけで集まって、終わったら解散。名前も知らなくていい、気楽なつながり。',
  applicationName: 'Chocotto',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Chocotto' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#6f4e37',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
        <PWARegister />
      </body>
    </html>
  );
}
