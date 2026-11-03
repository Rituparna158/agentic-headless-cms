import type { Metadata } from 'next';
import { type ReactNode, Suspense } from 'react';
import { QueryProvider } from '@/components/providers/query-provider';
import { UrlSanitizer } from '@/components/providers/url-sanitizer';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agentic CMS',
  description: 'Admin dashboard for the Agentic Headless CMS',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <QueryProvider>
          <Suspense fallback={null}>
            <UrlSanitizer />
          </Suspense>
          {children}
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
