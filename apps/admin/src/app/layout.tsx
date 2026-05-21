import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'SOS24 Admin',
  description: 'Административная панель SOS24',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} h-full`}>
      <body className="h-full"><Providers>{children}</Providers></body>
    </html>
  );
}
