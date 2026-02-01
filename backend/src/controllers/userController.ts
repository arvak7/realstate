import { Request, Response } from 'express';
import { prisma } from '../config';
import { AuthenticatedRequest } from '../middleware/auth';

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

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.auth!.payload.sub;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                profilePhotoUrl: true,
                oauthProfileImage: true,
                identityVerified: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getUserByEmail = async (req: Request, res: Response) => {
    try {
        const { email } = req.query;
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                profilePhotoUrl: true,
                oauthProfileImage: true,
                authProvider: true,
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const generateProfilePhotoUploadUrl = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.auth!.payload.sub;
        const { filename } = req.body;

        if (!filename) {
            return res.status(400).json({ error: 'Filename is required' });
        }

        // Validate file extension
        const ext = filename.split('.').pop()?.toLowerCase();
        if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
            return res.status(400).json({ error: 'Invalid file type. Only jpg, png, and webp are allowed' });
        }

        const { minioClient } = await import('../services/init');
        const objectName = `profile-photos/${userId}-${Date.now()}.${ext}`;

        // Generate presigned URL for upload (valid for 5 minutes)
        const uploadUrl = await minioClient.presignedPutObject('user-profiles', objectName, 5 * 60);

        // Generate public URL for accessing the image
        const publicUrl = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/user-profiles/${objectName}`;

        res.json({ uploadUrl, publicUrl, objectName });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateProfilePhoto = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.auth!.payload.sub;
        const { photoUrl } = req.body;

        if (!photoUrl) {
            return res.status(400).json({ error: 'photoUrl is required' });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { profilePhotoUrl: photoUrl },
            select: {
                id: true,
                email: true,
                name: true,
                profilePhotoUrl: true
            }
        });

        res.json(user);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const deleteProfilePhoto = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.auth!.payload.sub;

        // Get current photo URL to delete from MinIO
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { profilePhotoUrl: true }
        });

        if (user?.profilePhotoUrl && user.profilePhotoUrl.includes('user-profiles/')) {
            try {
                const { minioClient } = await import('../services/init');
                const objectName = user.profilePhotoUrl.split('user-profiles/')[1];
                await minioClient.removeObject('user-profiles', objectName);
            } catch (err) {
                console.error('Failed to delete photo from MinIO:', err);
                // Continue anyway to update DB
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { profilePhotoUrl: null },
            select: {
                id: true,
                email: true,
                name: true,
                profilePhotoUrl: true
            }
        });

        res.json(updatedUser);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
