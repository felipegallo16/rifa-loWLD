'use client';

interface SelectedTicketsProps {
  selectedNumbers: number[];
  onRemoveNumber: (number: number) => void;
  price: number;
  onPurchase: () => void;
}

export default function SelectedTickets({
  selectedNumbers,
  onRemoveNumber,
  price,
  onPurchase
}: SelectedTicketsProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">
          Tus Tickets Seleccionados
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Total:</span>
          <span className="text-lg font-bold text-primary">
            {selectedNumbers.length * price} WLD
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {selectedNumbers.map((number) => (
          <div
            key={number}
            className="relative flex items-center bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-lg border-2 border-dashed border-primary/30"
          >
            {/* Círculos decorativos en los bordes del ticket */}
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-white border-2 border-primary/30 rounded-full" />
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-white border-2 border-primary/30 rounded-full" />
            
            <div className="flex-1 flex items-center gap-4">
              {/* Icono de ticket */}
              <div className="text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              
              {/* Número del ticket */}
              <span className="text-2xl font-bold text-gray-800">
                #{number.toString().padStart(4, '0')}
              </span>
              
              {/* Precio */}
              <span className="text-sm text-gray-500">
                {price} WLD
              </span>
            </div>

            {/* Botón para eliminar */}
            <button
              onClick={() => onRemoveNumber(number)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {selectedNumbers.length > 0 && (
        <button
          onClick={onPurchase}
          className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          Participar con {selectedNumbers.length} ticket{selectedNumbers.length !== 1 ? 's' : ''}
        </button>
      )}

      {selectedNumbers.length === 0 && (
        <div className="text-center text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <p>No has seleccionado ningún ticket</p>
        </div>
      )}
    </div>
  );
} 