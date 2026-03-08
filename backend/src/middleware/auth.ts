import { auth } from 'express-oauth2-jwt-bearer';
import { Request, Response, NextFunction } from 'express';
import { readFileSync } from 'fs';
import { resolve } from 'path';
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

// Lazily loaded Zitadel admin PAT for Management API calls
let _adminPat: string | null = null;
function getAdminPat(): string | null {
    if (_adminPat !== null) return _adminPat || null;
    _adminPat = process.env.ZITADEL_ADMIN_PAT || '';
    if (!_adminPat) {
        try {
            _adminPat = readFileSync(
                resolve(__dirname, '../../../infra/machinekey/admin.pat'), 'utf-8'
            ).trim();
        } catch {
            _adminPat = '';
        }
    }
    return _adminPat || null;
}

// Resolve auth provider from JWT amr (Authentication Method Reference) claim.
function resolveAuthProvider(payload: Record<string, unknown>): string {
    const amr = payload.amr;
    if (Array.isArray(amr) && amr.includes('external')) {
        return 'google'; // Only Google configured for now
    }
    return 'zitadel';
}

// Fetch exact IdP name from Zitadel and update authProvider in DB.
async function syncIdpFromZitadel(userId: string): Promise<void> {
    const pat = getAdminPat();
    if (!pat) return;

    const issuer = process.env.ZITADEL_ISSUER || 'http://localhost:8080';
    try {
        const res = await fetch(`${issuer}/v2/users/${userId}/links`, {
            headers: { 'Authorization': `Bearer ${pat}` },
        });
        if (!res.ok) return;

        const data = await res.json() as { idpLinks?: Array<{ idpId?: string; idpName?: string; userId?: string }> };
        const link = data.idpLinks?.[0];
        if (!link) return;

        const provider = link.idpName?.toLowerCase().replace(/\s+/g, '_') || 'external_idp';
        await prisma.user.update({
            where: { id: userId },
            data: {
                authProvider: provider,
                ...(link.userId && { providerId: link.userId }),
            },
        });
        console.log(`[auth] Refined authProvider to '${provider}' for user ${userId}`);
    } catch (err) {
        console.error('[auth] Failed to sync IdP from Zitadel:', err);
    }
}

// Fetch user profile from Zitadel Management API (name, email, avatar).
// This is the reliable source of truth — JWT tokens from Login V2 lack these claims.
interface ZitadelUserProfile {
    email: string | null;
    name: string | null;
    avatarUrl: string | null;
}

async function fetchZitadelUserProfile(userId: string): Promise<ZitadelUserProfile | null> {
    const pat = getAdminPat();
    if (!pat) return null;

    const issuer = process.env.ZITADEL_ISSUER || 'http://localhost:8080';
    try {
        const res = await fetch(`${issuer}/v2/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${pat}` },
        });
        if (!res.ok) return null;

        const data = await res.json() as {
            user?: {
                human?: {
                    profile?: { displayName?: string; avatarUrl?: string };
                    email?: { email?: string };
                };
            };
        };
        const human = data.user?.human;
        return {
            email: human?.email?.email || null,
            name: human?.profile?.displayName || null,
            avatarUrl: human?.profile?.avatarUrl || null,
        };
    } catch (err) {
        console.error('[auth] Failed to fetch Zitadel user profile:', err);
        return null;
    }
}

// Auto-provision user in DB after successful Zitadel JWT validation.
// Fetches real name/email from Zitadel Management API since Login V2 JWT lacks these claims.
async function provisionUser(sub: string, payload: Record<string, unknown>): Promise<void> {
    const cached = userCache.get(sub);
    if (cached && Date.now() - cached < USER_CACHE_TTL) {
        return;
    }

    // Fetch real profile from Zitadel Management API (JWT from Login V2 lacks email/name)
    const zitadelProfile = await fetchZitadelUserProfile(sub);

    const email = zitadelProfile?.email || (payload.email as string) || `${sub}@zitadel.local`;
    const name = zitadelProfile?.name || (payload.name as string) || 'User';

    // Picture sources (in priority order):
    // 1. JWT picture claim (from Zitadel Action addPictureClaim, if it works)
    // 2. Zitadel profile avatarUrl (if user uploaded one)
    const oauthPicture = (typeof payload.picture === 'string' && payload.picture)
        ? payload.picture
        : (zitadelProfile?.avatarUrl || null);

    // Debug: log all picture-related data on provisioning
    console.log(`[auth][DEBUG] User ${sub} provisioning:`, {
        jwtPicture: payload.picture || '(none)',
        zitadelAvatarUrl: zitadelProfile?.avatarUrl || '(none)',
        resolvedPicture: oauthPicture || '(none)',
        jwtClaims: Object.keys(payload),
    });

    const authProvider = resolveAuthProvider(payload);

    try {
        const existing = await prisma.user.findUnique({
            where: { id: sub },
            select: { oauthProfileImage: true, authProvider: true },
        });

        await prisma.user.upsert({
            where: { id: sub },
            update: {
                email,
                name,
                ...(oauthPicture && { oauthProfileImage: oauthPicture }),
            },
            create: {
                id: sub,
                email,
                name,
                authProvider,
                providerId: sub,
                ...(oauthPicture && { oauthProfileImage: oauthPicture }),
            },
        });

        const isNewUser = !existing;

        // Refine authProvider via Management API for external IdP users
        if ((isNewUser || existing?.authProvider === 'zitadel') && authProvider !== 'zitadel') {
            syncIdpFromZitadel(sub).catch(e => console.error('[auth] syncIdp error:', e));
        }

        if (zitadelProfile) {
            console.log(`[auth] Provisioned user ${sub} from Zitadel API: ${name} <${email}>`);
        }

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
                        authProvider,
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
