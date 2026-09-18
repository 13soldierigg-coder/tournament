import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LanguageProvider } from '@/i18n';
import { AuthProvider } from '@/lib/context/AuthContext';

export const metadata: Metadata = {
  title: 'Badminton Tournament Platform',
  description: 'BWF Standard Badminton Tournament Management & Live Court Scoring Platform',
};

export const viewport: Viewport = {
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
    <html lang="vi" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-cyan-500 selection:text-black">
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
