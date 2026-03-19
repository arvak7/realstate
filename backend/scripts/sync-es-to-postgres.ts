import { prisma, esClient } from '../src/config';

async function syncElasticsearchToPostgres() {
    try {
        console.log('Syncing properties from Elasticsearch to PostgreSQL...');

        // Get all documents from Elasticsearch
        const result = await esClient.search({
            index: 'properties',
            size: 10000,
            body: { query: { match_all: {} } }
        });

        const esProperties = result.hits.hits;
        console.log(`Found ${esProperties.length} properties in Elasticsearch`);

        if (esProperties.length === 0) {
            await prisma.$disconnect();
            return;
        }

        let created = 0;
        let skipped = 0;

        for (const esDoc of esProperties) {
            const esId = esDoc._id;
            const esSource = esDoc._source as any;
            const ownerId = esSource.owner_id;
            const address = esSource.location?.address || '';
            const privacyCircle = esSource.location?.privacy_circle_center;

            // Check if property already exists in PostgreSQL
            const existing = await prisma.property.findFirst({
                where: { elasticsearchId: esId }
            });

            if (existing) {
                console.log(`ℹ Property ${esId} already in PostgreSQL`);
                skipped++;
                continue;
            }

            // Ensure owner exists in PostgreSQL
            let owner = await prisma.user.findUnique({
                where: { id: ownerId }
            });

            if (!owner) {
                // Create placeholder user (will be updated when they login)
                owner = await prisma.user.create({
                    data: {
                        id: ownerId,
                        email: `${ownerId}@zitadel.local`,
                        name: 'Zitadel User',
                        authProvider: 'zitadel',
                        providerId: ownerId
                    }
                });
                console.log(`✓ Created placeholder user ${ownerId}`);
            }

            // Create property in PostgreSQL
            try {
                const property = await prisma.property.create({
                    data: {
                        ownerId: ownerId,
                        elasticsearchId: esId,
                        latitude: 0,
                        longitude: 0,
                        address: address,
                        privacyRadius: esSource.location?.privacy_radius || 500,
                        privacyCircleCenterLat: privacyCircle?.lat || 0,
                        privacyCircleCenterLon: privacyCircle?.lon || 0,
                        isPrivate: esSource.is_private || false,
                        accessRequirements: null
                    }
                });

                created++;
                console.log(`✓ Synced property ${esId} (owner: ${ownerId})`);
            } catch (e: any) {
                if (e?.code === 'P2002' && e?.meta?.target?.includes('elasticsearch_id')) {
                    console.log(`ℹ Property ${esId} already exists (constraint)`);
                    skipped++;
                } else {
                    console.error(`✗ Failed to sync property ${esId}:`, e.message);
                }
            }
        }

        console.log(`\n✅ Sync complete: ${created} created, ${skipped} skipped`);
        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

syncElasticsearchToPostgres();
