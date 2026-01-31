import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all property types
 * GET /api/catalogs/property-types
 */
export const getPropertyTypes = async (req: Request, res: Response) => {
    try {
        const data = await prisma.propertyType.findMany({
            where: { active: true },
            orderBy: { displayOrder: 'asc' },
            select: {
                code: true,
                labelCa: true,
                labelEs: true,
                labelEn: true,
            },
        });

        res.json({ data, count: data.length });
    } catch (error) {
        console.error('Error fetching property types:', error);
        res.status(500).json({ error: 'Failed to fetch property types' });
    }
};

/**
 * Get all property conditions
 * GET /api/catalogs/conditions
 */
export const getPropertyConditions = async (req: Request, res: Response) => {
    try {
        const data = await prisma.propertyCondition.findMany({
            where: { active: true },
            orderBy: { displayOrder: 'asc' },
            select: {
                code: true,
                labelCa: true,
                labelEs: true,
                labelEn: true,
            },
        });

        res.json({ data, count: data.length });
    } catch (error) {
        console.error('Error fetching property conditions:', error);
        res.status(500).json({ error: 'Failed to fetch property conditions' });
    }
};

/**
 * Get all orientations
 * GET /api/catalogs/orientations
 */
export const getOrientations = async (req: Request, res: Response) => {
    try {
        const data = await prisma.orientation.findMany({
            where: { active: true },
            orderBy: { displayOrder: 'asc' },
            select: {
                code: true,
                labelCa: true,
                labelEs: true,
                labelEn: true,
            },
        });

        res.json({ data, count: data.length });
    } catch (error) {
        console.error('Error fetching orientations:', error);
        res.status(500).json({ error: 'Failed to fetch orientations' });
    }
};

/**
 * Get all energy labels
 * GET /api/catalogs/energy-labels
 */
export const getEnergyLabels = async (req: Request, res: Response) => {
    try {
        const data = await prisma.energyLabel.findMany({
            where: { active: true },
            orderBy: { displayOrder: 'asc' },
            select: {
                code: true,
                label: true,
            },
        });

        res.json({ data, count: data.length });
    } catch (error) {
        console.error('Error fetching energy labels:', error);
        res.status(500).json({ error: 'Failed to fetch energy labels' });
    }
};

/**
 * Get all provinces
 * GET /api/catalogs/provinces
 */
export const getProvinces = async (req: Request, res: Response) => {
    try {
        const data = await prisma.province.findMany({
            where: { active: true },
            orderBy: { name: 'asc' },
            select: {
                code: true,
                name: true,
                autonomousCommunity: true,
            },
        });

        res.json({ data, count: data.length });
    } catch (error) {
        console.error('Error fetching provinces:', error);
        res.status(500).json({ error: 'Failed to fetch provinces' });
    }
};

/**
 * Get municipalities, optionally filtered by province
 * GET /api/catalogs/municipalities?province=<code>
 */
export const getMunicipalities = async (req: Request, res: Response) => {
    try {
        const { province } = req.query;

        const where: any = { active: true };
        if (province && typeof province === 'string') {
            where.provinceCode = province;
        }

        const data = await prisma.municipality.findMany({
            where,
            orderBy: { name: 'asc' },
            select: {
                code: true,
                name: true,
                provinceCode: true,
            },
        });

        res.json({ data, count: data.length });
    } catch (error) {
        console.error('Error fetching municipalities:', error);
        res.status(500).json({ error: 'Failed to fetch municipalities' });
    }
};
