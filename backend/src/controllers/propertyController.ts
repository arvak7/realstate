import { Request, Response } from 'express';
import { prisma, esClient, minioClient, MINIO_BUCKET } from '../config';
import { AuthenticatedRequest } from '../middleware/auth';
import { sanitizeAddress, isValidCoordinates, generatePrivacyCircleCenter } from '../utils/location';
import { validatePrivacyRadius, FEATURES } from '../config/features';

export const getProperties = async (req: Request, res: Response) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            minPrice,
            maxPrice,
            rooms,
            lat,
            lon,
            radius = '5km'
        } = req.query;

        // Build Elasticsearch query
        const must: any[] = [];
        const filter: any[] = [];

        if (search) {
            must.push({
                multi_match: {
                    query: search,
                    fields: ['basic_info.title^2', 'basic_info.description', 'location.address']
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

        // Geo distance search using privacy circle center
        if (lat && lon) {
            const latitude = parseFloat(lat as string);
            const longitude = parseFloat(lon as string);
            if (isValidCoordinates(latitude, longitude)) {
                filter.push({
                    geo_distance: {
                        distance: radius as string,
                        'location.privacy_circle_center': {
                            lat: latitude,
                            lon: longitude
                        }
                    }
                });
            }
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
            const location = source?.location || {};
            return {
                id: hit._id,
                owner_id: source?.owner_id,
                basic_info: source?.basic_info,
                characteristics: source?.characteristics,
                energy: source?.energy,
                tags: source?.tags,
                images: source?.images,
                contact: source?.contact,
                verifications: source?.verifications,
                metadata: source?.metadata,
                location: {
                    address: location.address,
                    privacyCircle: {
                        centerLat: location.privacy_circle_center?.lat,
                        centerLon: location.privacy_circle_center?.lon,
                        radius: location.privacy_radius
                    },
                    isApproximate: true
                }
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

        // Check if requester is the owner (can see exact location)
        const isOwner = req.auth?.payload?.sub === property.ownerId;
        const esSource = (esResult._source as any) || {};

        // Prepare response - never expose exact coordinates to non-owners
        const response: any = {
            id: property.id,
            ownerId: property.ownerId,
            status: property.status,
            isPrivate: property.isPrivate,
            createdAt: property.createdAt,
            updatedAt: property.updatedAt,
            owner: property.owner,
            basic_info: esSource.basic_info,
            characteristics: esSource.characteristics,
            energy: esSource.energy,
            tags: esSource.tags,
            images: esSource.images,
            contact: esSource.contact,
            verifications: esSource.verifications,
            metadata: esSource.metadata
        };

        if (isOwner) {
            // Owner can see exact location
            response.location = {
                latitude: property.latitude,
                longitude: property.longitude,
                address: property.address,
                privacyRadius: property.privacyRadius,
                privacyCircle: {
                    centerLat: property.privacyCircleCenterLat,
                    centerLon: property.privacyCircleCenterLon,
                    radius: property.privacyRadius
                }
            };
        } else {
            // Non-owners only see privacy circle (approximate location)
            response.location = {
                address: sanitizeAddress(property.address),
                privacyCircle: {
                    centerLat: property.privacyCircleCenterLat,
                    centerLon: property.privacyCircleCenterLon,
                    radius: property.privacyRadius
                },
                isApproximate: true
            };
        }

        res.json(response);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const createProperty = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.auth!.payload.sub;
        const propertyData = req.body;

        // Extract and validate location data
        const locationInput = propertyData.location || {};
        console.log('DEBUG: locationInput', JSON.stringify(locationInput));
        const latitude = parseFloat(locationInput.latitude);
        const longitude = parseFloat(locationInput.longitude);
        const address = locationInput.address || '';
        const privacyRadius = validatePrivacyRadius(locationInput.privacyRadius);
        console.log('DEBUG: Parsed values', { latitude, longitude, address, privacyRadius });

        if (!isValidCoordinates(latitude, longitude)) {
            return res.status(400).json({ error: 'Invalid coordinates. Latitude must be -90 to 90, longitude -180 to 180.' });
        }

        if (!address.trim()) {
            return res.status(400).json({ error: 'Address is required.' });
        }

        // Generate persistent privacy circle center
        const privacyCircle = generatePrivacyCircleCenter(latitude, longitude, privacyRadius);

        // Create document in Elasticsearch with privacy circle center (not real coords)
        const esResponse = await esClient.index({
            index: 'properties',
            document: {
                owner_id: userId,
                basic_info: propertyData.basic_info || {},
                location: {
                    privacy_circle_center: {
                        lat: privacyCircle.centerLat,
                        lon: privacyCircle.centerLon
                    },
                    address: sanitizeAddress(address),
                    privacy_radius: privacyRadius
                },
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

        // Create reference in PostgreSQL with exact coordinates and privacy circle
        const property = await prisma.property.create({
            data: {
                ownerId: userId,
                elasticsearchId: esResponse._id,
                latitude: latitude,
                longitude: longitude,
                address: address,
                privacyRadius: privacyRadius,
                privacyCircleCenterLat: privacyCircle.centerLat,
                privacyCircleCenterLon: privacyCircle.centerLon,
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

        // Extract and validate location if provided
        let latitude = property.latitude;
        let longitude = property.longitude;
        let address = property.address;
        let privacyRadius = property.privacyRadius;
        let privacyCircleCenterLat = property.privacyCircleCenterLat;
        let privacyCircleCenterLon = property.privacyCircleCenterLon;
        let locationChanged = false;

        if (propertyData.location) {
            const locationInput = propertyData.location;
            if (locationInput.latitude !== undefined) {
                const newLat = parseFloat(locationInput.latitude);
                if (newLat !== latitude) {
                    latitude = newLat;
                    locationChanged = true;
                }
            }
            if (locationInput.longitude !== undefined) {
                const newLon = parseFloat(locationInput.longitude);
                if (newLon !== longitude) {
                    longitude = newLon;
                    locationChanged = true;
                }
            }
            if (locationInput.address !== undefined) {
                address = locationInput.address;
            }
            if (locationInput.privacyRadius !== undefined) {
                const newRadius = validatePrivacyRadius(locationInput.privacyRadius);
                if (newRadius !== privacyRadius) {
                    privacyRadius = newRadius;
                    locationChanged = true;
                }
            }

            if (!isValidCoordinates(latitude, longitude)) {
                return res.status(400).json({ error: 'Invalid coordinates.' });
            }
        }

        // Regenerate privacy circle only if location or radius changed
        if (locationChanged) {
            const privacyCircle = generatePrivacyCircleCenter(latitude, longitude, privacyRadius);
            privacyCircleCenterLat = privacyCircle.centerLat;
            privacyCircleCenterLon = privacyCircle.centerLon;
        }

        // Update Elasticsearch with privacy circle center
        await esClient.update({
            index: 'properties',
            id: property.elasticsearchId,
            doc: {
                basic_info: propertyData.basic_info,
                location: {
                    privacy_circle_center: {
                        lat: privacyCircleCenterLat,
                        lon: privacyCircleCenterLon
                    },
                    address: sanitizeAddress(address),
                    privacy_radius: privacyRadius
                },
                characteristics: propertyData.characteristics,
                energy: propertyData.energy,
                tags: propertyData.tags,
                images: propertyData.images,
                contact: propertyData.contact,
                'metadata.updated_at': new Date().toISOString()
            }
        });

        // Update PostgreSQL with exact coordinates and privacy circle
        const updatedProperty = await prisma.property.update({
            where: { id },
            data: {
                latitude: latitude,
                longitude: longitude,
                address: address,
                privacyRadius: privacyRadius,
                privacyCircleCenterLat: privacyCircleCenterLat,
                privacyCircleCenterLon: privacyCircleCenterLon,
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
