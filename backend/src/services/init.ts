import { minioClient, MINIO_BUCKET, esClient, prisma } from '../config';

// Export for use in other modules
export { minioClient };

// Helper to check if bucket exists
export async function initMinio() {
    const buckets = [MINIO_BUCKET, 'user-profiles'];

    for (const bucket of buckets) {
        try {
            const exists = await minioClient.bucketExists(bucket);
            if (!exists) {
                await minioClient.makeBucket(bucket, 'us-east-1');
                console.log(`Bucket ${bucket} created.`);
                const policy = {
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Principal: { AWS: "*" },
                            Action: ["s3:GetObject"],
                            Resource: [`arn:aws:s3:::${bucket}/*`],
                        },
                    ],
                };
                await minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
            }
        } catch (err) {
            console.error(`Minio init error for bucket ${bucket}:`, err);
        }
    }
}

// Initialize Elasticsearch index
export async function initElasticsearch() {
    try {
        const indexExists = await esClient.indices.exists({ index: 'properties' });
        if (!indexExists) {
            await esClient.indices.create({
                index: 'properties',
                body: {
                    mappings: {
                        properties: {
                            id: { type: 'keyword' },
                            owner_id: { type: 'keyword' },
                            basic_info: {
                                properties: {
                                    type: { type: 'keyword' },
                                    title: { type: 'text', analyzer: 'standard' },
                                    description: { type: 'text', analyzer: 'standard' },
                                    price: { type: 'float' },
                                    rooms: { type: 'integer' },
                                    square_meters: { type: 'float' }
                                }
                            },
                            location: {
                                properties: {
                                    privacy_circle_center: { type: 'geo_point' },
                                    address: { type: 'text' },
                                    privacy_radius: { type: 'integer' }
                                }
                            },
                            characteristics: {
                                properties: {
                                    floors: { type: 'integer' },
                                    orientation: { type: 'keyword' },
                                    condition: { type: 'keyword' },
                                    age_range: { type: 'keyword' },
                                    has_elevator: { type: 'boolean' },
                                    is_furnished: { type: 'boolean' }
                                }
                            },
                            energy: {
                                properties: {
                                    energy_label: { type: 'keyword' },
                                    co2_emissions: { type: 'float' }
                                }
                            },
                            tags: { type: 'keyword' },
                            images: {
                                type: 'nested',
                                properties: {
                                    url: { type: 'keyword' },
                                    order: { type: 'integer' },
                                    is_main: { type: 'boolean' }
                                }
                            },
                            contact: {
                                properties: {
                                    phone: { type: 'keyword' },
                                    email: { type: 'keyword' }
                                }
                            },
                            verifications: {
                                properties: {
                                    property_verified: { type: 'boolean' },
                                    owner_identity_verified: { type: 'boolean' },
                                    has_professional_photos: { type: 'boolean' }
                                }
                            },
                            metadata: {
                                properties: {
                                    created_at: { type: 'date' },
                                    updated_at: { type: 'date' },
                                    views_count: { type: 'integer' },
                                    favorites_count: { type: 'integer' }
                                }
                            },
                            is_private: { type: 'boolean' }
                        }
                    }
                }
            });
            console.log('Elasticsearch index "properties" created.');
        }
    } catch (err) {
        console.error("Elasticsearch init error:", err);
    }
}

// Sync is_private from PostgreSQL to Elasticsearch for existing properties
export async function syncPrivacyToElasticsearch() {
    try {
        const properties = await prisma.property.findMany({
            select: { elasticsearchId: true, isPrivate: true },
        });

        if (properties.length === 0) return;

        const bulkOps = properties.flatMap((p) => [
            { update: { _index: 'properties', _id: p.elasticsearchId } },
            { doc: { is_private: p.isPrivate } },
        ]);

        const result = await esClient.bulk({ body: bulkOps });
        const errorCount = result.items?.filter((i: any) => i.update?.error).length || 0;
        console.log(`Synced is_private to ES for ${properties.length} properties (${errorCount} errors).`);
    } catch (err) {
        console.error('Failed to sync is_private to ES:', err);
    }
}
