import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // 1. Seed Property Types (codes only, translations in i18n)
    console.log('Seeding property types...');
    const propertyTypes = [
        { code: 'pis', displayOrder: 1 },
        { code: 'casa', displayOrder: 2 },
        { code: 'xalet', displayOrder: 3 },
        { code: 'estudi', displayOrder: 4 },
        { code: 'atic', displayOrder: 5 },
        { code: 'duplex', displayOrder: 6 },
        { code: 'triplex', displayOrder: 7 },
        { code: 'loft', displayOrder: 8 },
        { code: 'local', displayOrder: 9 },
        { code: 'oficina', displayOrder: 10 },
        { code: 'garatge', displayOrder: 11 },
        { code: 'terreny', displayOrder: 12 },
    ];
    for (const type of propertyTypes) {
        await prisma.propertyType.upsert({
            where: { code: type.code },
            update: {},
            create: type,
        });
    }

    // 2. Seed Property Conditions
    console.log('Seeding property conditions...');
    const conditions = [
        { code: 'nou', displayOrder: 1 },
        { code: 'quasi_nou', displayOrder: 2 },
        { code: 'bon_estat', displayOrder: 3 },
        { code: 'a_reformar', displayOrder: 4 },
        { code: 'en_construccio', displayOrder: 5 },
    ];
    for (const condition of conditions) {
        await prisma.propertyCondition.upsert({
            where: { code: condition.code },
            update: {},
            create: condition,
        });
    }

    // 3. Seed Orientations
    console.log('Seeding orientations...');
    const orientations = [
        { code: 'nord', displayOrder: 1 },
        { code: 'sud', displayOrder: 2 },
        { code: 'est', displayOrder: 3 },
        { code: 'oest', displayOrder: 4 },
        { code: 'nord_est', displayOrder: 5 },
        { code: 'nord_oest', displayOrder: 6 },
        { code: 'sud_est', displayOrder: 7 },
        { code: 'sud_oest', displayOrder: 8 },
    ];
    for (const orientation of orientations) {
        await prisma.orientation.upsert({
            where: { code: orientation.code },
            update: {},
            create: orientation,
        });
    }

    // 4. Seed Energy Labels
    console.log('Seeding energy labels...');
    const energyLabels = [
        { code: 'A', displayOrder: 1 },
        { code: 'B', displayOrder: 2 },
        { code: 'C', displayOrder: 3 },
        { code: 'D', displayOrder: 4 },
        { code: 'E', displayOrder: 5 },
        { code: 'F', displayOrder: 6 },
        { code: 'G', displayOrder: 7 },
        { code: 'en_tramit', displayOrder: 8 },
        { code: 'exempt', displayOrder: 9 },
    ];
    for (const label of energyLabels) {
        await prisma.energyLabel.upsert({
            where: { code: label.code },
            update: {},
            create: label,
        });
    }

    // 5. Create Initial Users for Development
    console.log('Creating initial users for development...');
    const demoUser = await prisma.user.upsert({
        where: { email: 'demo@realstate.com' },
        update: {},
        create: {
            email: 'demo@realstate.com',
            name: 'Demo User',
            authProvider: 'email',
            identityVerified: true,
        },
    });
    console.log(`Created user: ${demoUser.name}`);

    // 6. Create Admin User
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@realstate.com' },
        update: {},
        create: {
            email: 'admin@realstate.com',
            name: 'Admin User',
            authProvider: 'email',
            identityVerified: true,
        },
    });
    console.log(`Created user: ${adminUser.name}`);

    // 7. Create Sample Property for Development
    await prisma.property.upsert({
        where: { id: 'demo-property-id' },
        update: {},
        create: {
            id: 'demo-property-id',
            ownerId: demoUser.id,
            elasticsearchId: 'demo-es-id',
            status: 'active',
            isPrivate: false,
        },
    });
    console.log(`Created sample property for ${demoUser.name}`);

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
