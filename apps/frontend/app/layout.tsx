import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { QueryProvider } from '@/components/providers/query-provider';
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
        <QueryProvider>{children}</QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
