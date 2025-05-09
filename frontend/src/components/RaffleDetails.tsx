'use client';

interface RaffleStats {
  totalRevenue: number;
  uniqueParticipants: number;
  averageTicketsPerUser: number;
}

interface RaffleDetailsProps {
  title: string;
  description: string;
  totalTickets: number;
  soldTickets: number;
  priceWLD: number;
  endDate: string;
  stats: RaffleStats;
  status: string;
}

export default function RaffleDetails({
  title,
  description,
  totalTickets,
  soldTickets,
  priceWLD,
  endDate,
  stats,
  status
}: RaffleDetailsProps) {
  const progress = (soldTickets / totalTickets) * 100;
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'text-green-600';
      case 'CLOSED':
        return 'text-red-600';
      case 'CANCELLED':
        return 'text-gray-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
          <p className="text-gray-600">{description}</p>
        </div>
        <div className={`px-3 py-1 rounded-full ${getStatusColor(status)} bg-opacity-10`}>
          {status === 'OPEN' ? 'Abierta' :
           status === 'CLOSED' ? 'Cerrada' :
           status === 'CANCELLED' ? 'Cancelada' : status}
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Precio por ticket</p>
          <p className="text-xl font-bold text-primary">{priceWLD} WLD</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Fecha de cierre</p>
          <p className="text-xl font-bold text-gray-800">{formatDate(endDate)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Total recaudado</p>
          <p className="text-xl font-bold text-blue-600">{stats.totalRevenue.toFixed(2)} WLD</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Participantes</p>
          <p className="text-xl font-bold text-gray-800">{stats.uniqueParticipants}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Tickets vendidos: {soldTickets}</span>
          <span>Total: {totalTickets}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-primary h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Promedio de {stats.averageTicketsPerUser.toFixed(1)} tickets por participante
        </p>
      </div>

      <div className="text-sm text-gray-500 mt-4 flex items-center">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Verificado con World ID para garantizar transparencia
      </div>
    </div>
  );
} 