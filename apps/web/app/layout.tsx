import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Punjabi Dubbing Studio — Professional Dubbing Workstation',
  description: 'Local-first workstation for manually creating funny and natural Punjabi video dubs.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className="min-h-screen bg-studio-bg text-studio-text antialiased selection:bg-indigo-100 selection:text-indigo-800">
        {children}
      </body>
    </html>
  );
}
