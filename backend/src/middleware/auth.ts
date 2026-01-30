import { auth } from 'express-oauth2-jwt-bearer';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config';

// Define the interface for the extended request
export type AuthenticatedRequest = Request & {
    auth?: {
        payload: {
            sub: string;
            scope?: string;
        }
    };
};

// Actual JWT Check Middleware
const jwtCheck = auth({
    issuerBaseURL: process.env.ZITADEL_ISSUER,
    audience: process.env.ZITADEL_AUDIENCE || 'realstate-api',
});

export const checkJwt = async (req: Request, res: Response, next: NextFunction) => {
    // Development/Demo Bypass
    const authHeader = req.headers.authorization;
    if (authHeader === 'Bearer demo-token') {
        (req as AuthenticatedRequest).auth = {
            payload: {
                sub: 'demo-user-id',
                scope: 'openid profile email'
            }
        };

        // Ensure Demo User exists in DB
        try {
            await prisma.user.upsert({
                where: { id: 'demo-user-id' },
                update: {},
                create: {
                    id: 'demo-user-id',
                    email: 'demo@realstate.com',
                    name: 'Demo User',
                    authProvider: 'demo',
                    identityVerified: true
                }
            });
        } catch (err) {
            console.error("Failed to ensure demo user exists", err);
        }

        return next();
    }

    // Fallback to real JWT validation
    return jwtCheck(req, res, next);
};

// Optional Auth Middleware (doesn't fail if no token)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next();
    }
    return checkJwt(req, res, next);
};
