import { prisma, esClient } from '../src/config';

async function populateElasticsearchIds() {
    try {
        console.log('Populating elasticsearchId for all properties...');

        // Get all properties from PostgreSQL
        const pgProperties = await prisma.property.findMany();
        console.log(`Found ${pgProperties.length} properties in PostgreSQL`);

        if (pgProperties.length === 0) {
            console.log('No properties in PostgreSQL to update');
            await prisma.$disconnect();
            return;
        }

        // Get all documents from Elasticsearch
        const esResult = await esClient.search({
            index: 'properties',
            size: 10000,
            body: { query: { match_all: {} } }
        });

        const esProperties = esResult.hits.hits;
        console.log(`Found ${esProperties.length} properties in Elasticsearch`);

        // Create a map of owner_id -> elasticsearchId from Elasticsearch
        const esMap = new Map<string, string>();
        for (const esDoc of esProperties) {
            const owner_id = (esDoc._source as any)?.owner_id;
            if (owner_id) {
                // If multiple properties for same owner, just use the latest
                esMap.set(owner_id, esDoc._id);
            }
        }

        // Update PostgreSQL properties with their Elasticsearch IDs
        let updated = 0;
        for (const pgProperty of pgProperties) {
            if (!pgProperty.elasticsearchId) {
                const esId = esMap.get(pgProperty.ownerId);
                if (esId) {
                    await prisma.property.update({
                        where: { id: pgProperty.id },
                        data: { elasticsearchId: esId }
                    });
                    updated++;
                    console.log(`✓ Updated property ${pgProperty.id}: elasticsearchId = ${esId}`);
                } else {
                    console.log(`⚠ No Elasticsearch match found for property ${pgProperty.id} (owner: ${pgProperty.ownerId})`);
                }
            } else {
                console.log(`ℹ Property ${pgProperty.id} already has elasticsearchId: ${pgProperty.elasticsearchId}`);
            }
        }

        console.log(`\n✅ Updated ${updated} properties`);
        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

populateElasticsearchIds();
