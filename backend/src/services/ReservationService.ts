import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Reservation {
  raffleId: string;
  numbers: number[];
  userId: string;
  expiresAt: Date;
}

export class ReservationService {
  private reservations: Map<string, Reservation[]>;
  private readonly RESERVATION_TIMEOUT = 5 * 60 * 1000; // 5 minutos

  constructor() {
    this.reservations = new Map();
    this.cleanupReservations = this.cleanupReservations.bind(this);
    // Limpiar reservaciones expiradas cada minuto
    setInterval(this.cleanupReservations, 60 * 1000);
  }

  async reserveNumbers(raffleId: string, numbers: number[], userId: string): Promise<boolean> {
    // Limpiar reservaciones expiradas
    this.cleanupReservations();

    // Verificar si los números están disponibles
    const currentReservations = this.reservations.get(raffleId) || [];
    const reservedNumbers = currentReservations.flatMap(r => r.numbers);

    // Verificar si algún número ya está reservado
    const isAnyNumberReserved = numbers.some(num => reservedNumbers.includes(num));
    if (isAnyNumberReserved) {
      return false;
    }

    // Crear nueva reservación
    const reservation: Reservation = {
      raffleId,
      numbers,
      userId,
      expiresAt: new Date(Date.now() + this.RESERVATION_TIMEOUT)
    };

    // Guardar la reservación
    if (!this.reservations.has(raffleId)) {
      this.reservations.set(raffleId, []);
    }
    this.reservations.get(raffleId)?.push(reservation);

    return true;
  }

  isNumberReserved(raffleId: string, number: number): boolean {
    this.cleanupReservations();
    const raffleReservations = this.reservations.get(raffleId) || [];
    return raffleReservations.some(r => r.numbers.includes(number));
  }

  releaseReservation(raffleId: string, userId: string): void {
    const raffleReservations = this.reservations.get(raffleId) || [];
    const filteredReservations = raffleReservations.filter(r => r.userId !== userId);
    this.reservations.set(raffleId, filteredReservations);
  }

  private cleanupReservations(): void {
    const now = new Date();
    for (const [raffleId, reservations] of this.reservations.entries()) {
      const validReservations = reservations.filter(r => r.expiresAt > now);
      if (validReservations.length === 0) {
        this.reservations.delete(raffleId);
      } else {
        this.reservations.set(raffleId, validReservations);
      }
    }
  }
} 