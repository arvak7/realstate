import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seeding...');

    // 1. Create Demo User
    const demoUser = await prisma.user.upsert({
        where: { email: 'demo@realstate.com' },
        update: {},
        create: {
            id: 'demo-user-id',
            email: 'demo@realstate.com',
            name: 'Demo User',
            authProvider: 'demo',
            identityVerified: true,
        },
    });
    console.log(`Created user: ${demoUser.name}`);

    // 2. Create Admin User (Example)
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@realstate.com' },
        update: {},
        create: {
            id: 'admin-user-id',
            email: 'admin@realstate.com',
            name: 'Admin User',
            authProvider: 'email',
            identityVerified: true,
        },
    });
    console.log(`Created user: ${adminUser.name}`);

    console.log(`Created user: ${adminUser.name}`);

    // 3. Create Sample Property
    await prisma.property.create({
        data: {
            id: 'demo-property-id',
            ownerId: 'demo-user-id',
            status: 'active',
            isPrivate: false,
            elasticsearchId: 'demo-es-id', // Note: This won't be in ES unless we sync it, but fine for DB integrity
        }
    });
    console.log('Created sample property for Demo User');

    console.log('✅ Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
