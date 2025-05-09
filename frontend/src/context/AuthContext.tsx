'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useMiniKit } from '@worldcoin/minikit-react';

interface AuthContextType {
  isVerified: boolean;
  wldBalance: number;
  nullifierHash: string | null;
  verifyIdentity: () => Promise<void>;
}

const defaultContextValue: AuthContextType = {
  isVerified: false,
  wldBalance: 0,
  nullifierHash: null,
  verifyIdentity: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultContextValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [wldBalance, setWldBalance] = useState<number>(0);
  const [nullifierHash, setNullifierHash] = useState<string | null>(null);
  const minikit = useMiniKit();

  useEffect(() => {
    // Verificar si estamos en World App
    if (!minikit.isInstalled()) {
      console.log('Esta aplicación debe abrirse desde World App');
      return;
    }

    // Intentar obtener el estado de verificación al inicio
    checkVerificationStatus();
  }, [minikit]);

  const checkVerificationStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/verify/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setIsVerified(true);
        setWldBalance(data.wld_balance || 0);
        setNullifierHash(data.nullifier_hash);
      }
    } catch (error) {
      console.error('Error al verificar estado:', error);
    }
  };

  const verifyIdentity = async () => {
    try {
      // Usar el comando verify de MiniKit
      const result = await minikit.verify({
        app_id: process.env.NEXT_PUBLIC_WORLD_APP_ID || '',
        action: 'verify',
        signal: 'test_signal',
      });

      // Enviar la verificación al backend
      const response = await fetch('http://localhost:3001/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });

      const data = await response.json();
      if (data.success) {
        setIsVerified(true);
        setWldBalance(data.wld_balance || 0);
        setNullifierHash(data.nullifier_hash);
      }
    } catch (error) {
      console.error('Error en la verificación:', error);
    }
  };

  const contextValue: AuthContextType = {
    isVerified,
    wldBalance,
    nullifierHash,
    verifyIdentity,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 