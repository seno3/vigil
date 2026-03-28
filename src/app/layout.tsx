import type { Metadata } from 'next';
import { IBM_Plex_Mono, Inter } from 'next/font/google';
import './globals.css';

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'VORTEX — AI Tornado Impact Simulator',
  description:
    'Multi-agent AI tornado impact simulator. Type an address, choose an EF scale, and watch AI simulate a tornado strike across real building footprints in 3D.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ibmPlexMono.variable} ${inter.variable}`}>
      <body className="bg-[#0a0e17] text-white antialiased overflow-hidden">{children}</body>
    </html>
  );
}
