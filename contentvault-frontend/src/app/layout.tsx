import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ContentVault - Decentralized Content Monetization',
  description: 'Monetize your content directly with Walrus decentralized storage and blockchain payments',
  keywords: ['web3', 'decentralized', 'content', 'monetization', 'walrus', 'blockchain'],
  authors: [{ name: 'ContentVault Team' }],
  viewport: 'width=device-width, initial-scale=1',
  openGraph: {
    title: 'ContentVault - Decentralized Content Platform',
    description: 'The future of content creation and monetization',
    type: 'website',
    url: 'https://contentvault.io',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ContentVault',
    description: 'Decentralized content monetization platform',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}