'use client';

import { useState } from 'react';
import { endpoints } from '@/config/api';

interface RandomNumberButtonProps {
  raffleId: string;
  onNumberSelected?: (number: number) => void;
}

export default function RandomNumberButton({ raffleId, onNumberSelected }: RandomNumberButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [number, setNumber] = useState<number | null>(null);

  const getRandomNumber = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(endpoints.tickets.random(raffleId), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Sorteo no encontrado');
        } else if (response.status === 401) {
          throw new Error('Por favor, verifica tu identidad con World ID');
        } else {
          throw new Error('Error al obtener número aleatorio');
        }
      }

      const data = await response.json();
      setNumber(data.number);
      if (onNumberSelected) {
        onNumberSelected(data.number);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Error al obtener número aleatorio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={getRandomNumber}
        disabled={isLoading}
        className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Buscando número...</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>¡Quiero un número al azar!</span>
          </>
        )}
      </button>
      
      {error && (
        <div className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}
      
      {number && !error && (
        <div className="text-center animate-fade-in">
          <p className="text-lg">¡Tu número de la suerte es!</p>
          <p className="text-4xl font-bold text-primary mt-2">#{number.toString().padStart(4, '0')}</p>
          <p className="text-sm text-gray-500 mt-1">Este número está reservado por 5 minutos</p>
        </div>
      )}
    </div>
  );
} 