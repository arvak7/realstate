import { Response } from 'express';
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

export const getMe = (req: AuthenticatedRequest, res: Response) => {
    res.json({
        message: 'Hello from protected endpoint',
        user: req.auth?.payload
    });
};
