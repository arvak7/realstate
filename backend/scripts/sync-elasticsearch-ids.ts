import { prisma, esClient } from '../src/config';

async function syncElasticsearchIds() {
    try {
        console.log('Syncing Elasticsearch IDs from Elasticsearch to PostgreSQL...');

        // Get all documents from Elasticsearch
        const result = await esClient.search({
            index: 'properties',
            size: 10000,
            body: { query: { match_all: {} } }
        });

        const esProperties = result.hits.hits;
        console.log(`Found ${esProperties.length} properties in Elasticsearch`);

        let updated = 0;
        for (const esDoc of esProperties) {
            const esId = esDoc._id;
            const esSource = esDoc._source as any;

            // Find property by owner_id and basic_info to match it
            const propertyData = await prisma.property.findFirst({
                where: {
                    ownerId: esSource.owner_id
                }
            });

            if (propertyData && !propertyData.elasticsearchId) {
                await prisma.property.update({
                    where: { id: propertyData.id },
                    data: { elasticsearchId: esId }
                });
                updated++;
                console.log(`Updated: ${propertyData.id} → ${esId}`);
            }
        }

        console.log(`✓ Synced ${updated} properties`);
        await prisma.$disconnect();
    } catch (error) {
        console.error('Error syncing:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

syncElasticsearchIds();
