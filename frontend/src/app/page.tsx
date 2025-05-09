'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';
import RaffleDetails from '@/components/RaffleDetails';
import NumberSelector from '@/components/NumberSelector';
import SelectedTickets from '@/components/SelectedTickets';
import RandomNumberButton from '@/components/RandomNumberButton';
import WorldIDButton from '@/components/WorldIDButton';
import WLDBalance from '@/components/WLDBalance';

// Datos de ejemplo - en producción vendrían de la API
const mockRaffle = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Gran Sorteo Benéfico',
  description: 'Sorteo para recaudar fondos para la fundación XYZ. ¡Participa y ayuda a una buena causa!',
  totalTickets: 1000,
  soldTickets: 150,
  priceWLD: 1.0,
  endDate: '2024-12-31',
  status: 'OPEN',
  stats: {
    totalRevenue: 150.0,
    uniqueParticipants: 45,
    averageTicketsPerUser: 3.33
  }
};

const mockAvailableNumbers = Array.from(
  { length: mockRaffle.totalTickets },
  (_, i) => i + 1
).filter(n => n > mockRaffle.soldTickets);

// Constante para modo desarrollo
const isDevelopment = process.env.NODE_ENV === 'development';

export default function Home() {
  const { isVerified, verifyIdentity, wldBalance, nullifierHash } = useAuth();
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [isWorldApp, setIsWorldApp] = useState<boolean>(false);
  const [showDevTools, setShowDevTools] = useState<boolean>(false);

  useEffect(() => {
    // En desarrollo, permitimos simular World App
    if (isDevelopment) {
      setIsWorldApp(true);
      setShowDevTools(true);
      return;
    }

    // En producción, detectar si estamos dentro de World App
    const checkWorldApp = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return userAgent.includes('world') || window.location.href.includes('world.app');
    };
    setIsWorldApp(checkWorldApp());
  }, []);

  const handleSelectNumber = (number: number) => {
    if (!isVerified) {
      alert('Por favor, verifica tu identidad para participar');
      return;
    }
    
    const totalCost = (selectedNumbers.length + 1) * mockRaffle.priceWLD;
    if (wldBalance < totalCost) {
      alert('No tienes suficiente balance WLD para comprar más tickets');
      return;
    }

    if (selectedNumbers.includes(number)) {
      setSelectedNumbers(prev => prev.filter(n => n !== number));
    } else {
      setSelectedNumbers(prev => [...prev, number]);
    }
  };

  const handleRemoveNumber = (number: number) => {
    setSelectedNumbers(prev => prev.filter(n => n !== number));
  };

  const handleRandomNumber = (number: number) => {
    if (!isVerified) {
      alert('Por favor, verifica tu identidad para participar');
      return;
    }

    const totalCost = (selectedNumbers.length + 1) * mockRaffle.priceWLD;
    if (wldBalance < totalCost) {
      alert('No tienes suficiente balance WLD para comprar más tickets');
      return;
    }

    if (!selectedNumbers.includes(number)) {
      setSelectedNumbers(prev => [...prev, number]);
    }
  };

  const handlePurchase = async () => {
    if (!isVerified) {
      alert('Por favor, verifica tu identidad para participar');
      return;
    }

    const totalCost = selectedNumbers.length * mockRaffle.priceWLD;
    if (wldBalance < totalCost) {
      alert('No tienes suficiente balance WLD para comprar estos tickets');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/tickets/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raffleId: mockRaffle.id,
          numbers: selectedNumbers,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('¡Compra exitosa!');
        setSelectedNumbers([]);
      } else {
        alert('Error al procesar la compra: ' + data.error);
      }
    } catch (error) {
      console.error('Error purchasing tickets:', error);
      alert('Error al procesar la compra');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Logo */}
          <div className="flex justify-center mb-12">
            <Logo className="h-32" />
          </div>

          {/* Dev Tools */}
          {showDevTools && (
            <div className="bg-gray-100 border border-gray-300 p-4 rounded-lg mb-8">
              <h3 className="text-lg font-semibold mb-2">🛠️ Modo Desarrollo</h3>
              <p className="text-sm text-gray-600 mb-4">
                Estás en modo desarrollo. La aplicación se comportará como si estuviera dentro de World App.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => verifyIdentity({ nullifier_hash: 'test_hash', credential_type: 'orb' })}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Simular Verificación
                </button>
              </div>
            </div>
          )}

          {/* World App Check */}
          {!isWorldApp ? (
            <WorldIDButton />
          ) : (
            <>
              {/* Detalles del sorteo */}
              <RaffleDetails {...mockRaffle} />

              {isVerified && nullifierHash && (
                <div className="space-y-4">
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center">
                    <p className="font-medium">¡Identidad verificada!</p>
                  </div>
                  <WLDBalance nullifierHash={nullifierHash} />
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-8">
                {/* Selector de números y botón aleatorio */}
                <div className="space-y-4">
                  <NumberSelector
                    availableNumbers={mockAvailableNumbers}
                    onSelectNumber={handleSelectNumber}
                    selectedNumbers={selectedNumbers}
                    wldBalance={wldBalance}
                    ticketPriceWLD={mockRaffle.priceWLD}
                  />
                  <RandomNumberButton 
                    raffleId={mockRaffle.id}
                    onNumberSelected={handleRandomNumber}
                  />
                </div>

                {/* Tickets seleccionados */}
                <SelectedTickets
                  selectedNumbers={selectedNumbers}
                  onRemoveNumber={handleRemoveNumber}
                  price={mockRaffle.priceWLD}
                  onPurchase={handlePurchase}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
} 