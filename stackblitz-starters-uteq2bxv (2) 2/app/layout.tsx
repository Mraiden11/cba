// app/layout.tsx
import './globals.css';
import { Header } from '@/components/Header';

export const metadata = {
  title: 'School Fee Manager',
  description: 'Login page',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
