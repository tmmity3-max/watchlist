import './globals.css';

export const metadata = {
  title: 'TM Watchlist — Smart Trading Watchlists',
  description: 'Sync your trading watchlists across devices with TM Watchlist.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-base-bg text-base-text antialiased">{children}</body>
    </html>
  );
}
