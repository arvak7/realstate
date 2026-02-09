import { auth } from 'express-oauth2-jwt-bearer';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config';

// Define the interface for the extended request
export type AuthenticatedRequest = Request & {
    auth?: {
        payload: {
            sub: string;
            scope?: string;
            email?: string;
            name?: string;
            [key: string]: unknown;
        }
    };
};

// In-memory cache for user provisioning (avoids DB hit on every request)
const userCache = new Map<string, number>();
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Auto-provision user in DB after successful Zitadel JWT validation.
// Works for all user types: internal Zitadel users, Google, Facebook, etc.
// Zitadel assigns a unique sub for each user regardless of the identity provider.
async function provisionUser(sub: string, payload: Record<string, unknown>): Promise<void> {
    const cached = userCache.get(sub);
    if (cached && Date.now() - cached < USER_CACHE_TTL) {
        return;
    }

    const email = (payload.email as string) ||
                  (payload['urn:zitadel:iam:user:email'] as string) ||
                  `${sub}@zitadel.local`;
    const name = (payload.name as string) ||
                 (payload['urn:zitadel:iam:user:human:first_name'] as string) ||
                 'User';

    try {
        await prisma.user.upsert({
            where: { id: sub },
            update: { email, name },
            create: {
                id: sub,
                email,
                name,
                authProvider: 'zitadel',
                providerId: sub,
            },
        });
        userCache.set(sub, Date.now());
    } catch (err: any) {
        // Handle email uniqueness conflict (e.g. demo user has same email)
        if (err?.code === 'P2002' && err?.meta?.target?.includes('email')) {
            try {
                await prisma.user.upsert({
                    where: { id: sub },
                    update: { name },
                    create: {
                        id: sub,
                        email: `${sub}@zitadel.local`,
                        name,
                        authProvider: 'zitadel',
                        providerId: sub,
                    },
                });
                userCache.set(sub, Date.now());
                console.warn(`[auth] Email conflict for ${email}, user ${sub} created with fallback email`);
            } catch (innerErr) {
                console.error('[auth] Failed to provision user with fallback email', innerErr);
            }
        } else {
            console.error('[auth] Failed to provision user', err);
        }
    }
}

// Zitadel JWT validation
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

    // Zitadel JWT validation with user auto-provisioning
    return jwtCheck(req, res, (err?: any) => {
        if (err) {
            return next(err);
        }

        const authReq = req as AuthenticatedRequest;
        const payload = authReq.auth?.payload;
        if (payload?.sub) {
            provisionUser(payload.sub, payload as Record<string, unknown>)
                .catch(e => console.error('[auth] provisionUser error:', e))
                .finally(() => next());
        } else {
            next();
        }
    });
};

// Optional Auth Middleware (doesn't fail if no token)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next();
    }
    return checkJwt(req, res, next);
};
