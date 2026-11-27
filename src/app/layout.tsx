import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ComedKares | Multilingual Voice-First Agentic AI Receptionist Platform',
  description: 'Plug-and-play AI Receptionist platform for multi-clinic healthcare appointment management.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
