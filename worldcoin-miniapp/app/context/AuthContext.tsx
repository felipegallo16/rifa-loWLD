'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface AuthContextType {
  isVerified: boolean;
  nullifierHash: string | null;
  credentialType: string | null;
  verifyIdentity: (proof: any) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  isVerified: false,
  nullifierHash: null,
  credentialType: null,
  verifyIdentity: async () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isVerified, setIsVerified] = useState(false);
  const [nullifierHash, setNullifierHash] = useState<string | null>(null);
  const [credentialType, setCredentialType] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si hay un nullifier_hash guardado
    const savedHash = api.getNullifierHash();
    if (savedHash) {
      setNullifierHash(savedHash);
      setIsVerified(true);
    }
  }, []);

  const verifyIdentity = async (proof: any): Promise<boolean> => {
    const response = await api.verifyIdentity(proof);
    
    if (response.success) {
      setIsVerified(true);
      setNullifierHash(response.nullifier_hash || null);
      setCredentialType(response.credential_type || null);
      return true;
    }
    
    return false;
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isVerified, 
        nullifierHash, 
        credentialType,
        verifyIdentity 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 