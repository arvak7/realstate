// Simple script to check if database needs seeding
const { PrismaClient } = require('@prisma/client');

async function checkSeed() {
  const prisma = new PrismaClient();
  try {
    const count = await prisma.propertyType.count();
    console.log(count === 0 ? 'NEEDS_SEED' : 'ALREADY_SEEDED');
    process.exit(0);
  } catch (err) {
    console.log('ERROR');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkSeed();
