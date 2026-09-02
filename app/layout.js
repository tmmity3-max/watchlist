import './globals.css';

export const metadata = {
  title: 'TM Watchlist',
  description: 'Companion dashboard for the TM Watchlist Chrome extension',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-base-bg text-base-text antialiased">{children}</body>
    </html>
  );
}
