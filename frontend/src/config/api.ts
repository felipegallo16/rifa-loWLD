export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const endpoints = {
  tickets: {
    random: (raffleId: string) => `${API_URL}/tickets/raffle/${raffleId}/random`,
    available: (raffleId: string) => `${API_URL}/tickets/raffle/${raffleId}/available`,
    purchase: `${API_URL}/tickets/purchase`,
  },
  raffles: {
    get: (id: string) => `${API_URL}/raffles/${id}`,
    list: `${API_URL}/raffles`,
  },
}; 