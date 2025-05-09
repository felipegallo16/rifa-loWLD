'use client';

import { useState, useEffect } from 'react';
import { IDKitWidget, ISuccessResult, VerificationLevel } from '@worldcoin/idkit';
import { useAuth } from './context/AuthContext';
import { api, RaffleResponse } from './services/api';
import RaffleCard from './components/RaffleCard';

export default function Home() {
  const { isVerified, verifyIdentity } = useAuth();
  const [raffles, setRaffles] = useState<RaffleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRaffles();
  }, []);

  const loadRaffles = async () => {
    try {
      const data = await api.getRaffles();
      setRaffles(data);
    } catch (error) {
      setError('Error al cargar los sorteos');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (result: ISuccessResult) => {
    const success = await verifyIdentity(result);
    if (success) {
      await loadRaffles(); // Recargar los sorteos después de la verificación
    }
  };

  const handleBuyTickets = async (raffleId: string, quantity: number) => {
    try {
      const result = await api.buyTickets(raffleId, quantity);
      if (result.success) {
        await loadRaffles(); // Recargar los sorteos para actualizar el estado
      } else {
        setError(result.error || 'Error al comprar tickets');
      }
    } catch (error) {
      setError('Error al procesar la compra');
    }
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Rifa-lo
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Sorteos verificados con World ID
          </p>

          {!isVerified && (
            <div className="mb-8">
              <IDKitWidget
                app_id="app_7ec5fc1205e05862fcd2ecd6f8bdb0ab"
                action="verify"
                onSuccess={handleVerification}
                handleVerify={async (proof) => {
                  // La verificación real se hace en el backend
                  return;
                }}
                verification_level={VerificationLevel.Device}
              >
                {({ open }) => (
                  <button 
                    onClick={open}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
                  >
                    Verificar identidad para participar
                  </button>
                )}
              </IDKitWidget>
            </div>
          )}

          {isVerified && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-8">
              <p className="font-medium">
                ¡Identidad verificada! Ya puedes participar en los sorteos.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
              <p className="font-medium">{error}</p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center">
            <p className="text-gray-600">Cargando sorteos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {raffles.map((raffle) => (
              <RaffleCard
                key={raffle.id}
                raffle={{
                  ...raffle,
                  endDate: new Date(raffle.endDate)
                }}
                isVerified={isVerified}
                onBuyTickets={(quantity) => handleBuyTickets(raffle.id, quantity)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
