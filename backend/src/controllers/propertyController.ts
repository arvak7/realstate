import { Request, Response } from 'express';
import { prisma, esClient, minioClient, MINIO_BUCKET } from '../config';
import { AuthenticatedRequest } from '../middleware/auth';

export const getProperties = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 20, search, minPrice, maxPrice, rooms, municipality } = req.query;

        // Build Elasticsearch query
        const must: any[] = [];
        const filter: any[] = [];

        if (search) {
            must.push({
                multi_match: {
                    query: search,
                    fields: ['basic_info.title^2', 'basic_info.description', 'location.municipality']
                }
            });
        }

        if (minPrice || maxPrice) {
            const range: { gte?: number; lte?: number } = {};
            if (minPrice) range.gte = parseFloat(minPrice as string);
            if (maxPrice) range.lte = parseFloat(maxPrice as string);
            filter.push({ range: { 'basic_info.price': range } });
        }

        if (rooms) {
            filter.push({ term: { 'basic_info.rooms': parseInt(rooms as string) } });
        }

        if (municipality) {
            filter.push({ term: { 'location.municipality': municipality } });
        }

        const esQuery = {
            bool: {
                must: must.length > 0 ? must : [{ match_all: {} }],
                filter
            }
        };

        const from = (parseInt(page as string) - 1) * parseInt(limit as string);

        const result = await esClient.search({
            index: 'properties',
            from,
            size: parseInt(limit as string),
            body: {
                query: esQuery,
                sort: [{ 'metadata.created_at': 'desc' }]
            }
        });

        const properties = result.hits.hits.map(hit => {
            const source = hit._source as any;
            return {
                id: hit._id,
                ...(source || {})
            };
        });

        res.json({
            properties,
            total: (result.hits.total as any).value,
            page: parseInt(page as string),
            limit: parseInt(limit as string)
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getPropertyById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Try to find by PostgreSQL ID first, then by Elasticsearch ID
        let property = await prisma.property.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        identityVerified: true
                    }
                }
            }
        });

        // If not found by PostgreSQL ID, try finding by Elasticsearch ID
        if (!property) {
            property = await prisma.property.findFirst({
                where: { elasticsearchId: id },
                include: {
                    owner: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            identityVerified: true
                        }
                    }
                }
            });
        }

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Get full data from Elasticsearch
        const esResult = await esClient.get({
            index: 'properties',
            id: property.elasticsearchId
        });

        // Increment view count
        await prisma.propertyView.create({
            data: {
                propertyId: property.id,
                userId: req.auth?.payload?.sub || null,
                ipAddress: req.ip
            }
        });

        res.json({
            ...property,
            ...((esResult._source as any) || {})
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const createProperty = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.auth!.payload.sub;
        const propertyData = req.body;

        // Create document in Elasticsearch
        const esResponse = await esClient.index({
            index: 'properties',
            document: {
                owner_id: userId,
                basic_info: propertyData.basic_info || {},
                location: propertyData.location || {},
                characteristics: propertyData.characteristics || {},
                energy: propertyData.energy || {},
                tags: propertyData.tags || [],
                images: propertyData.images || [],
                contact: propertyData.contact || {},
                verifications: {
                    property_verified: false,
                    owner_identity_verified: false,
                    has_professional_photos: false
                },
                metadata: {
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    views_count: 0,
                    favorites_count: 0
                }
            }
        });

        // Create reference in PostgreSQL
        const property = await prisma.property.create({
            data: {
                ownerId: userId,
                elasticsearchId: esResponse._id,
                isPrivate: propertyData.isPrivate || false,
                accessRequirements: propertyData.accessRequirements || null
            }
        });

        res.status(201).json(property);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create property' });
    }
};

export const updateProperty = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.auth!.payload.sub;
        const propertyData = req.body;

        // Check ownership
        const property = await prisma.property.findUnique({
            where: { id }
        });

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        if (property.ownerId !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Update Elasticsearch
        await esClient.update({
            index: 'properties',
            id: property.elasticsearchId,
            doc: {
                basic_info: propertyData.basic_info,
                location: propertyData.location,
                characteristics: propertyData.characteristics,
                energy: propertyData.energy,
                tags: propertyData.tags,
                images: propertyData.images,
                contact: propertyData.contact,
                'metadata.updated_at': new Date().toISOString()
            }
        });

        // Update PostgreSQL
        const updatedProperty = await prisma.property.update({
            where: { id },
            data: {
                isPrivate: propertyData.isPrivate,
                accessRequirements: propertyData.accessRequirements,
                status: propertyData.status
            }
        });

        res.json(updatedProperty);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to update property' });
    }
};

export const deleteProperty = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.auth!.payload.sub;

        // Check ownership
        const property = await prisma.property.findUnique({
            where: { id }
        });

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        if (property.ownerId !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Delete from Elasticsearch
        await esClient.delete({
            index: 'properties',
            id: property.elasticsearchId
        });

        // Delete from PostgreSQL (CASCADE will delete related records)
        await prisma.property.delete({
            where: { id }
        });

        res.json({ message: 'Property deleted successfully' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to delete property' });
    }
};

export const generateUploadUrl = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { contentType } = req.body || {};

        // Determine file extension from content type
        const extensionMap: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
        };
        const extension = extensionMap[contentType] || 'jpg';

        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

        // expiry 15 minutes
        const presignedUrl = await minioClient.presignedPutObject(MINIO_BUCKET, filename, 15 * 60);
        // We use env vars for constructing public URL because it might differ from internal docker URL
        const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
        const port = process.env.MINIO_PORT || '9000';
        const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
        const viewUrl = `${protocol}://${endpoint}:${port}/${MINIO_BUCKET}/${filename}`;

        res.json({ uploadUrl: presignedUrl, filename, viewUrl });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to generate signed URL' });
    }
};

export const getMyProperties = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.auth!.payload.sub;

        const properties = await prisma.property.findMany({
            where: { ownerId: userId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(properties);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
