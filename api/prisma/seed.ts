import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.participant.deleteMany();
  await prisma.event.deleteMany();

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const upcoming = await prisma.event.create({
    data: {
      name: "Degustação VB Alimentos",
      description: "Apresentação da nova linha de produtos e networking com o time comercial.",
      startsAt: new Date(now + 7 * day),
      location: "São Paulo, SP",
      capacity: 40,
    },
  });

  const almostFull = await prisma.event.create({
    data: {
      name: "Workshop de Qualidade",
      description: "Boas práticas de qualidade e rastreabilidade na cadeia de alimentos.",
      startsAt: new Date(now + 3 * day),
      location: "Campinas, SP",
      capacity: 3,
    },
  });

  await prisma.event.create({
    data: {
      name: "Feira de Fornecedores 2025",
      description: "Evento já realizado com parceiros e fornecedores.",
      startsAt: new Date(now - 20 * day),
      location: "Belo Horizonte, MG",
      capacity: 80,
    },
  });

  await prisma.participant.createMany({
    data: [
      { eventId: upcoming.id, name: "Ana Souza", email: "ana@example.com" },
      { eventId: upcoming.id, name: "Bruno Lima", email: "bruno@example.com" },
      { eventId: almostFull.id, name: "Carla Dias", email: "carla@example.com" },
      { eventId: almostFull.id, name: "Diego Alves", email: "diego@example.com" },
    ],
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
