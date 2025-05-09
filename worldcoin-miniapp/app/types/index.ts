export interface Raffle {
  id: string;
  title: string;
  description: string;
  price: number; // precio en WLD
  totalTickets: number;
  soldTickets: number;
  endDate: Date;
  status: 'open' | 'closed';
  winnerId?: string;
}

export interface Ticket {
  id: string;
  raffleId: string;
  nullifierHash: string;
  quantity: number;
  purchaseDate: Date;
}

export interface VerifiedUser {
  nullifierHash: string;
  verificationLevel: 'orb' | 'phone';
  tickets: Ticket[];
} 