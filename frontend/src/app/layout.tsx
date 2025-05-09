import { MiniKitProvider } from '@worldcoin/minikit-react';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';
import type { Metadata } from 'next';
import ClientLayout from './ClientLayout';

export const metadata: Metadata = {
  title: 'Rifa-lo',
  description: 'Plataforma de sorteos verificados con World ID',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <MiniKitProvider>
        <AuthProvider>
          <body>
            <ClientLayout>{children}</ClientLayout>
          </body>
        </AuthProvider>
      </MiniKitProvider>
    </html>
  );
} 