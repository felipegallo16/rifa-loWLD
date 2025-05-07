import { Express } from 'express';
import { verifyProof } from '../controllers/worldid.controller';
import { purchaseTicket, getAvailableNumbers } from '../controllers/ticket.controller';

export const setupRoutes = (app: Express) => {
  // World ID routes
  app.post('/api/verify', verifyProof);

  // Ticket routes
  app.post('/api/tickets/purchase', purchaseTicket);
  app.get('/api/tickets/available/:raffleId', getAvailableNumbers);
}; 