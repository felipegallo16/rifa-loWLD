'use client';

import { Raffle } from '../types';
import { useState } from 'react';

interface RaffleCardProps {
  raffle: Raffle;
  onBuyTickets?: (quantity: number) => void;
  isVerified: boolean;
}

export default function RaffleCard({ raffle, onBuyTickets, isVerified }: RaffleCardProps) {
  const [quantity, setQuantity] = useState(1);

  const handleBuyTickets = () => {
    onBuyTickets?.(quantity);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
      <h3 className="text-xl font-bold mb-2">{raffle.title}</h3>
      <p className="text-gray-600 mb-4">{raffle.description}</p>
      
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium">Precio por ticket:</span>
        <span className="text-lg font-bold">{raffle.price} WLD</span>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium">Tickets disponibles:</span>
        <span className="text-lg">{raffle.totalTickets - raffle.soldTickets}/{raffle.totalTickets}</span>
      </div>

      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium">Termina en:</span>
        <span className="text-lg">
          {new Date(raffle.endDate).toLocaleDateString()}
        </span>
      </div>

      {raffle.status === 'open' && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-4">
            <label htmlFor="quantity" className="text-sm font-medium">
              Cantidad de tickets:
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              max={raffle.totalTickets - raffle.soldTickets}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="border rounded px-2 py-1 w-20 text-center"
            />
          </div>

          <button
            onClick={handleBuyTickets}
            disabled={!isVerified || raffle.status === 'closed'}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {!isVerified 
              ? 'Verifica tu identidad para participar'
              : `Comprar tickets - ${quantity * raffle.price} WLD`}
          </button>
        </div>
      )}

      {raffle.status === 'closed' && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <p className="text-center font-medium">
            {raffle.winnerId 
              ? 'Sorteo finalizado - ¡Ganador seleccionado!' 
              : 'Sorteo finalizado - Seleccionando ganador...'}
          </p>
        </div>
      )}
    </div>
  );
} 