import type { Metadata } from 'next';
import './globals.css';
import { getSession } from '@/lib/auth';
import { Navbar } from '@/components/navbar';

export const metadata: Metadata = {
  title: 'SIMASPRAS - Politeknik Imigrasi dan Pemasyarakatan',
  description: 'Sistem Informasi Peminjaman Sarana dan Prasarana Politeknik Imigrasi dan Pemasyarakatan Indonesia (Poltekimipas)',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSession();

  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
        <Navbar user={user} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <p>© 2026 SIMASPRAS Poltekimipas. Politeknik Imigrasi dan Pemasyarakatan Indonesia.</p>
        </footer>
      </body>
    </html>
  );
}
