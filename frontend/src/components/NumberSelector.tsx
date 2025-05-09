'use client';

import { useState } from 'react';

interface NumberSelectorProps {
  availableNumbers: number[];
  onSelectNumber: (number: number) => void;
  selectedNumbers: number[];
  wldBalance?: number;
  ticketPriceWLD: number;
}

export default function NumberSelector({
  availableNumbers,
  onSelectNumber,
  selectedNumbers,
  wldBalance,
  ticketPriceWLD
}: NumberSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const numbersPerPage = 100;

  const filteredNumbers = availableNumbers.filter(num => 
    num.toString().includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredNumbers.length / numbersPerPage);
  const startIndex = (currentPage - 1) * numbersPerPage;
  const displayedNumbers = filteredNumbers.slice(startIndex, startIndex + numbersPerPage);

  const totalCost = selectedNumbers.length * ticketPriceWLD;
  const canAffordMore = (wldBalance ?? 0) >= (selectedNumbers.length + 1) * ticketPriceWLD;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">Selecciona tus números</h3>
          <p className="text-sm text-gray-600">
            Precio por ticket: {ticketPriceWLD.toFixed(2)} WLD
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Tu balance</p>
          <p className="font-semibold text-blue-600">{(wldBalance ?? 0).toFixed(2)} WLD</p>
        </div>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar número..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-6">
        {displayedNumbers.map((number) => (
          <button
            key={number}
            onClick={() => onSelectNumber(number)}
            disabled={!selectedNumbers.includes(number) && !canAffordMore}
            className={`
              aspect-square rounded-lg text-sm font-medium transition-all duration-200
              ${selectedNumbers.includes(number)
                ? 'bg-blue-500 text-white'
                : !canAffordMore
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}
            `}
          >
            {number}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-sm text-gray-600">Tickets seleccionados: {selectedNumbers.length}</p>
          <p className="font-medium">Total: {totalCost.toFixed(2)} WLD</p>
        </div>
        {!canAffordMore && selectedNumbers.length > 0 && (
          <p className="text-sm text-orange-600">
            Balance insuficiente para más tickets
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-gray-100 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-4 py-2">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-gray-100 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
} 