import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const montserrat = Montserrat({
  weight: ['300', '400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Adria Cross - Professional Personal Stylist',
  description:
    'Transform your style with expert personal styling services from Adria Cross',
  keywords: [
    'personal stylist',
    'wardrobe consultant',
    'fashion styling',
    'color analysis',
  ],
  authors: [{ name: 'Adria Cross' }],
  openGraph: {
    title: 'Adria Cross - Professional Personal Stylist',
    description: 'Transform your style with expert personal styling services',
    type: 'website',
    locale: 'en_US',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={montserrat.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
