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
                displayOrder: true,
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
                displayOrder: true,
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
                displayOrder: true,
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
                displayOrder: true,
            },
        });

        res.json({ data, count: data.length });
    } catch (error) {
        console.error('Error fetching energy labels:', error);
        res.status(500).json({ error: 'Failed to fetch energy labels' });
    }
};

