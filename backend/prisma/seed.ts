import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seeding...');

    // 1. Property Types
    console.log('Seeding property types...');
    const propertyTypes = [
        { code: 'pis', labelCa: 'Pis', labelEs: 'Piso', labelEn: 'Apartment', displayOrder: 1 },
        { code: 'casa', labelCa: 'Casa', labelEs: 'Casa', labelEn: 'House', displayOrder: 2 },
        { code: 'xalet', labelCa: 'Xalet', labelEs: 'Chalet', labelEn: 'Chalet', displayOrder: 3 },
        { code: 'estudi', labelCa: 'Estudi', labelEs: 'Estudio', labelEn: 'Studio', displayOrder: 4 },
        { code: 'atic', labelCa: 'Àtic', labelEs: 'Ático', labelEn: 'Penthouse', displayOrder: 5 },
        { code: 'duplex', labelCa: 'Dúplex', labelEs: 'Dúplex', labelEn: 'Duplex', displayOrder: 6 },
        { code: 'triplex', labelCa: 'Tríplex', labelEs: 'Tríplex', labelEn: 'Triplex', displayOrder: 7 },
        { code: 'loft', labelCa: 'Loft', labelEs: 'Loft', labelEn: 'Loft', displayOrder: 8 },
        { code: 'local', labelCa: 'Local', labelEs: 'Local', labelEn: 'Commercial Space', displayOrder: 9 },
        { code: 'oficina', labelCa: 'Oficina', labelEs: 'Oficina', labelEn: 'Office', displayOrder: 10 },
        { code: 'garatge', labelCa: 'Garatge', labelEs: 'Garaje', labelEn: 'Garage', displayOrder: 11 },
        { code: 'terreny', labelCa: 'Terreny', labelEs: 'Terreno', labelEn: 'Land', displayOrder: 12 },
    ];
    for (const type of propertyTypes) {
        await prisma.propertyType.upsert({
            where: { code: type.code },
            update: {},
            create: type,
        });
    }

    // 2. Property Conditions
    console.log('Seeding property conditions...');
    const conditions = [
        { code: 'nou', labelCa: 'Nou', labelEs: 'Nuevo', labelEn: 'New', displayOrder: 1 },
        { code: 'quasi_nou', labelCa: 'Quasi nou', labelEs: 'Casi nuevo', labelEn: 'Almost New', displayOrder: 2 },
        { code: 'bon_estat', labelCa: 'Bon estat', labelEs: 'Buen estado', labelEn: 'Good Condition', displayOrder: 3 },
        { code: 'a_reformar', labelCa: 'A reformar', labelEs: 'A reformar', labelEn: 'To Renovate', displayOrder: 4 },
        { code: 'en_construccio', labelCa: 'En construcció', labelEs: 'En construcción', labelEn: 'Under Construction', displayOrder: 5 },
    ];
    for (const condition of conditions) {
        await prisma.propertyCondition.upsert({
            where: { code: condition.code },
            update: {},
            create: condition,
        });
    }

    // 3. Orientations
    console.log('Seeding orientations...');
    const orientations = [
        { code: 'nord', labelCa: 'Nord', labelEs: 'Norte', labelEn: 'North', displayOrder: 1 },
        { code: 'nord-est', labelCa: 'Nord-est', labelEs: 'Noreste', labelEn: 'Northeast', displayOrder: 2 },
        { code: 'est', labelCa: 'Est', labelEs: 'Este', labelEn: 'East', displayOrder: 3 },
        { code: 'sud-est', labelCa: 'Sud-est', labelEs: 'Sureste', labelEn: 'Southeast', displayOrder: 4 },
        { code: 'sud', labelCa: 'Sud', labelEs: 'Sur', labelEn: 'South', displayOrder: 5 },
        { code: 'sud-oest', labelCa: 'Sud-oest', labelEs: 'Suroeste', labelEn: 'Southwest', displayOrder: 6 },
        { code: 'oest', labelCa: 'Oest', labelEs: 'Oeste', labelEn: 'West', displayOrder: 7 },
        { code: 'nord-oest', labelCa: 'Nord-oest', labelEs: 'Noroeste', labelEn: 'Northwest', displayOrder: 8 },
    ];
    for (const orientation of orientations) {
        await prisma.orientation.upsert({
            where: { code: orientation.code },
            update: {},
            create: orientation,
        });
    }

    // 4. Energy Labels
    console.log('Seeding energy labels...');
    const energyLabels = [
        { code: 'A', label: 'A', displayOrder: 1 },
        { code: 'B', label: 'B', displayOrder: 2 },
        { code: 'C', label: 'C', displayOrder: 3 },
        { code: 'D', label: 'D', displayOrder: 4 },
        { code: 'E', label: 'E', displayOrder: 5 },
        { code: 'F', label: 'F', displayOrder: 6 },
        { code: 'G', label: 'G', displayOrder: 7 },
        { code: 'en_tramit', label: 'En tràmit', displayOrder: 8 },
        { code: 'exempt', label: 'Exempt', displayOrder: 9 },
    ];
    for (const label of energyLabels) {
        await prisma.energyLabel.upsert({
            where: { code: label.code },
            update: {},
            create: label,
        });
    }

    // 5. Provinces (Spanish provinces with autonomous communities)
    console.log('Seeding provinces...');
    const provinces = [
        // Catalunya
        { code: 'barcelona', name: 'Barcelona', autonomousCommunity: 'Catalunya' },
        { code: 'girona', name: 'Girona', autonomousCommunity: 'Catalunya' },
        { code: 'lleida', name: 'Lleida', autonomousCommunity: 'Catalunya' },
        { code: 'tarragona', name: 'Tarragona', autonomousCommunity: 'Catalunya' },
        // Comunitat Valenciana
        { code: 'valencia', name: 'València', autonomousCommunity: 'Comunitat Valenciana' },
        { code: 'alicante', name: 'Alacant', autonomousCommunity: 'Comunitat Valenciana' },
        { code: 'castellon', name: 'Castelló', autonomousCommunity: 'Comunitat Valenciana' },
        // Madrid
        { code: 'madrid', name: 'Madrid', autonomousCommunity: 'Comunidad de Madrid' },
        // Andalucía
        { code: 'sevilla', name: 'Sevilla', autonomousCommunity: 'Andalucía' },
        { code: 'malaga', name: 'Málaga', autonomousCommunity: 'Andalucía' },
        { code: 'granada', name: 'Granada', autonomousCommunity: 'Andalucía' },
        { code: 'cordoba', name: 'Córdoba', autonomousCommunity: 'Andalucía' },
        { code: 'cadiz', name: 'Cádiz', autonomousCommunity: 'Andalucía' },
        { code: 'almeria', name: 'Almería', autonomousCommunity: 'Andalucía' },
        { code: 'huelva', name: 'Huelva', autonomousCommunity: 'Andalucía' },
        { code: 'jaen', name: 'Jaén', autonomousCommunity: 'Andalucía' },
        // País Vasco
        { code: 'vizcaya', name: 'Bizkaia', autonomousCommunity: 'País Vasco' },
        { code: 'guipuzcoa', name: 'Gipuzkoa', autonomousCommunity: 'País Vasco' },
        { code: 'alava', name: 'Araba', autonomousCommunity: 'País Vasco' },
        // Galicia
        { code: 'a_coruna', name: 'A Coruña', autonomousCommunity: 'Galicia' },
        { code: 'pontevedra', name: 'Pontevedra', autonomousCommunity: 'Galicia' },
        { code: 'ourense', name: 'Ourense', autonomousCommunity: 'Galicia' },
        { code: 'lugo', name: 'Lugo', autonomousCommunity: 'Galicia' },
        // Aragón
        { code: 'zaragoza', name: 'Zaragoza', autonomousCommunity: 'Aragón' },
        { code: 'huesca', name: 'Huesca', autonomousCommunity: 'Aragón' },
        { code: 'teruel', name: 'Teruel', autonomousCommunity: 'Aragón' },
        // Illes Balears
        { code: 'balears', name: 'Illes Balears', autonomousCommunity: 'Illes Balears' },
        // Canarias
        { code: 'las_palmas', name: 'Las Palmas', autonomousCommunity: 'Canarias' },
        { code: 'santa_cruz_tenerife', name: 'Santa Cruz de Tenerife', autonomousCommunity: 'Canarias' },
        // Others
        { code: 'asturias', name: 'Asturias', autonomousCommunity: 'Principado de Asturias' },
        { code: 'cantabria', name: 'Cantabria', autonomousCommunity: 'Cantabria' },
        { code: 'murcia', name: 'Murcia', autonomousCommunity: 'Región de Murcia' },
        { code: 'navarra', name: 'Navarra', autonomousCommunity: 'Comunidad Foral de Navarra' },
        { code: 'la_rioja', name: 'La Rioja', autonomousCommunity: 'La Rioja' },
    ];
    for (const province of provinces) {
        await prisma.province.upsert({
            where: { code: province.code },
            update: {},
            create: province,
        });
    }

    // 6. Municipalities (Major cities)
    console.log('Seeding municipalities...');
    const municipalities = [
        // Barcelona
        { code: 'barcelona_city', name: 'Barcelona', provinceCode: 'barcelona' },
        { code: 'hospitalet', name: "L'Hospitalet de Llobregat", provinceCode: 'barcelona' },
        { code: 'badalona', name: 'Badalona', provinceCode: 'barcelona' },
        { code: 'terrassa', name: 'Terrassa', provinceCode: 'barcelona' },
        { code: 'sabadell', name: 'Sabadell', provinceCode: 'barcelona' },
        { code: 'mataro', name: 'Mataró', provinceCode: 'barcelona' },
        { code: 'sant_cugat', name: 'Sant Cugat del Vallès', provinceCode: 'barcelona' },
        // Girona
        { code: 'girona_city', name: 'Girona', provinceCode: 'girona' },
        { code: 'figueres', name: 'Figueres', provinceCode: 'girona' },
        // Tarragona
        { code: 'tarragona_city', name: 'Tarragona', provinceCode: 'tarragona' },
        { code: 'reus', name: 'Reus', provinceCode: 'tarragona' },
        // Lleida
        { code: 'lleida_city', name: 'Lleida', provinceCode: 'lleida' },
        // Madrid
        { code: 'madrid_city', name: 'Madrid', provinceCode: 'madrid' },
        { code: 'mostoles', name: 'Móstoles', provinceCode: 'madrid' },
        { code: 'alcala_henares', name: 'Alcalá de Henares', provinceCode: 'madrid' },
        // Valencia
        { code: 'valencia_city', name: 'València', provinceCode: 'valencia' },
        { code: 'torrent', name: 'Torrent', provinceCode: 'valencia' },
        // Alicante
        { code: 'alicante_city', name: 'Alacant', provinceCode: 'alicante' },
        { code: 'elche', name: 'Elx', provinceCode: 'alicante' },
        // Sevilla
        { code: 'sevilla_city', name: 'Sevilla', provinceCode: 'sevilla' },
        // Málaga
        { code: 'malaga_city', name: 'Málaga', provinceCode: 'malaga' },
        { code: 'marbella', name: 'Marbella', provinceCode: 'malaga' },
        // Bilbao
        { code: 'bilbao', name: 'Bilbao', provinceCode: 'vizcaya' },
        // Zaragoza
        { code: 'zaragoza_city', name: 'Zaragoza', provinceCode: 'zaragoza' },
    ];
    for (const municipality of municipalities) {
        await prisma.municipality.upsert({
            where: { code: municipality.code },
            update: {},
            create: municipality,
        });
    }

    // 7. Create Demo User
    console.log('Creating demo users...');
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

    // 8. Create Admin User
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

    // 9. Create Sample Property
    await prisma.property.upsert({
        where: { id: 'demo-property-id' },
        update: {},
        create: {
            id: 'demo-property-id',
            ownerId: 'demo-user-id',
            status: 'active',
            isPrivate: false,
            elasticsearchId: 'demo-es-id',
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

