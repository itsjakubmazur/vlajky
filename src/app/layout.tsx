import type { Metadata, Viewport } from 'next';
import { APP_NAME, APP_TAGLINE } from '@/config/app';
import { ProgressProvider } from '@/store/StoreProvider';
import './globals.css';

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
  applicationName: APP_NAME,
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: 'default' },
  icons: { icon: '/icon.svg', apple: '/icon-180.png' },
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className="min-h-dvh antialiased">
        <ProgressProvider>{children}</ProgressProvider>
      </body>
    </html>
  );
}
