const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface VerificationResponse {
  success: boolean;
  nullifier_hash?: string;
  credential_type?: string;
  error?: string;
}

export interface RaffleResponse {
  id: string;
  title: string;
  description: string;
  price: number;
  totalTickets: number;
  soldTickets: number;
  endDate: string;
  status: 'open' | 'closed';
  winnerId?: string;
}

export interface TicketResponse {
  id: string;
  raffleId: string;
  quantity: number;
  purchaseDate: string;
}

class ApiService {
  private nullifierHash: string | null = null;

  setNullifierHash(hash: string) {
    this.nullifierHash = hash;
    localStorage.setItem('worldcoin_nullifier', hash);
  }

  getNullifierHash(): string | null {
    if (!this.nullifierHash) {
      this.nullifierHash = localStorage.getItem('worldcoin_nullifier');
    }
    return this.nullifierHash;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const nullifierHash = this.getNullifierHash();
    if (nullifierHash) {
      headers['x-worldid-nullifier'] = nullifierHash;
    }

    return headers;
  }

  async verifyIdentity(proof: any): Promise<VerificationResponse> {
    try {
      const response = await fetch(`${API_URL}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proof),
      });

      const data = await response.json();
      
      if (data.success && data.nullifier_hash) {
        this.setNullifierHash(data.nullifier_hash);
      }

      return data;
    } catch (error) {
      console.error('Error verifying identity:', error);
      return { success: false, error: 'Error al verificar identidad' };
    }
  }

  async getRaffles(): Promise<RaffleResponse[]> {
    try {
      const response = await fetch(`${API_URL}/raffles`, {
        headers: this.getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching raffles:', error);
      return [];
    }
  }

  async buyTickets(raffleId: string, quantity: number): Promise<{ success: boolean; ticket?: TicketResponse; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          raffleId,
          quantity,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('Error buying tickets:', error);
      return { success: false, error: 'Error al comprar tickets' };
    }
  }

  async getUserTickets(): Promise<TicketResponse[]> {
    const nullifierHash = this.getNullifierHash();
    if (!nullifierHash) {
      return [];
    }

    try {
      const response = await fetch(`${API_URL}/tickets/user/${nullifierHash}`, {
        headers: this.getHeaders(),
      });
      const data = await response.json();
      return data.success ? data.tickets : [];
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      return [];
    }
  }
}

export const api = new ApiService(); 