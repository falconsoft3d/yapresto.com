const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('Testing Prisma models...');
  console.log('Available models:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));
  
  try {
    const config = await prisma.configuracionCredito.findMany();
    console.log('ConfiguracionCredito works!', config);
  } catch (error) {
    console.error('Error with configuracionCredito:', error.message);
  }
  
  await prisma.$disconnect();
}

test();
