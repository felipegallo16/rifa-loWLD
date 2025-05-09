import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Crear usuario de prueba
  const testUser = await prisma.user.upsert({
    where: { nullifier_hash: 'test_user_123' },
    update: {},
    create: {
      nullifier_hash: 'test_user_123',
      role: 'ADMIN',
      wld_balance: 100
    },
  });

  // Crear sorteo de prueba
  const testRaffle = await prisma.raffle.create({
    data: {
      name: 'Sorteo de Prueba',
      description: 'Este es un sorteo de prueba para testing',
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días desde ahora
      status: 'OPEN',
      stats: {
        create: {
          totalRevenue: 0,
          ticketsSold: 0,
          uniqueParticipants: 0,
          averageTicketsPerUser: 0
        }
      }
    }
  });

  // Crear algunos tickets de prueba
  const tickets = await Promise.all(
    [1, 2, 3, 4, 5].map(number => 
      prisma.ticket.create({
        data: {
          number,
          userId: testUser.id,
          raffleId: testRaffle.id
        }
      })
    )
  );

  console.log('Datos de prueba creados:', { testUser, testRaffle, tickets });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 