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

// Lazily load the Zitadel admin PAT for metadata API calls
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

// Resolve the auth provider from the JWT's amr (Authentication Method Reference) claim.
// Returns a provisional value: 'google' for external IdPs, 'zitadel' for internal users.
// The actual IdP name is refined asynchronously by syncIdpFromZitadel().
function resolveAuthProvider(payload: Record<string, unknown>): string {
    const amr = payload.amr;
    if (Array.isArray(amr) && amr.includes('external')) {
        // External IdP - we only have Google configured for now
        return 'google';
    }
    // Internal Zitadel user (password, passkey, etc.)
    return 'zitadel';
}

// Fetch the exact IdP name from Zitadel Management API and update authProvider in DB.
// This runs asynchronously after provisioning to refine 'google' → actual IdP name.
async function syncIdpFromZitadel(userId: string): Promise<void> {
    const pat = getAdminPat();
    if (!pat) return;

    const issuer = process.env.ZITADEL_ISSUER || 'http://localhost:8080';
    try {
        // Zitadel v2 API: list IdP links for the user
        const res = await fetch(`${issuer}/v2/users/${userId}/links`, {
            headers: { 'Authorization': `Bearer ${pat}` },
        });
        if (res.ok) {
            const data = await res.json() as { idpLinks?: Array<{ idpId?: string; idpName?: string; userId?: string }> };
            const links = data.idpLinks || [];
            if (links.length > 0) {
                const link = links[0];
                // Normalize the IdP name: "Google" → "google"
                const provider = link.idpName?.toLowerCase().replace(/\s+/g, '_') || 'external_idp';
                const externalUserId = link.userId || null;
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        authProvider: provider,
                        ...(externalUserId && { providerId: externalUserId }),
                    },
                });
                console.log(`[auth] Refined authProvider to '${provider}' for user ${userId}`);
            }
        }
    } catch (err) {
        console.error('[auth] Failed to sync IdP from Zitadel:', err);
    }
}

// Fetch user's picture from Zitadel metadata and store in DB
async function syncPictureFromZitadel(userId: string): Promise<void> {
    const pat = getAdminPat();
    if (!pat) return;

    const issuer = process.env.ZITADEL_ISSUER || 'http://localhost:8080';
    try {
        const res = await fetch(`${issuer}/management/v1/users/${userId}/metadata/picture`, {
            headers: { 'Authorization': `Bearer ${pat}` },
        });
        if (res.ok) {
            const data = await res.json() as { metadata?: { value?: string } };
            if (data.metadata?.value) {
                const pictureUrl = Buffer.from(data.metadata.value, 'base64').toString('utf-8');
                if (pictureUrl && pictureUrl.startsWith('http')) {
                    await prisma.user.update({
                        where: { id: userId },
                        data: { oauthProfileImage: pictureUrl },
                    });
                    console.log(`[auth] Synced picture from Zitadel metadata for user ${userId}`);
                }
            }
        }
    } catch (err) {
        // Non-critical: don't break auth if picture sync fails
        console.error('[auth] Failed to sync picture from Zitadel:', err);
    }
}

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

    // Extract OAuth profile image from JWT payload
    let oauthPicture: string | null = null;

    // 1) Standard OIDC picture claim (from Google, Facebook, etc. via Zitadel)
    if (typeof payload.picture === 'string' && payload.picture) {
        oauthPicture = payload.picture;
    }

    // 2) Zitadel metadata object (from urn:zitadel:iam:user:metadata scope)
    if (!oauthPicture) {
        const metaObj = payload['urn:zitadel:iam:user:metadata'];
        if (metaObj && typeof metaObj === 'object') {
            const picB64 = (metaObj as Record<string, unknown>).picture;
            if (typeof picB64 === 'string' && picB64) {
                try {
                    oauthPicture = Buffer.from(picB64, 'base64').toString('utf-8');
                } catch {
                    oauthPicture = picB64;
                }
            }
        }
    }

    // Determine provisional auth provider from JWT amr claim
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
                ...(oauthPicture && { oauthProfileImage: oauthPicture })
            },
            create: {
                id: sub,
                email,
                name,
                authProvider,
                providerId: sub,
                ...(oauthPicture && { oauthProfileImage: oauthPicture })
            },
        });

        // Log OAuth picture extraction for debugging
        if (oauthPicture) {
            console.log(`[auth] Extracted OAuth picture from JWT payload for user ${sub}`);
        }

        // On first provisioning: refine authProvider via Management API (async, non-blocking)
        // Also re-sync if still at default value (e.g. user existed before this feature)
        const isNewUser = !existing;
        const needsIdpSync = isNewUser || existing?.authProvider === 'zitadel';
        if (needsIdpSync && authProvider !== 'zitadel') {
            syncIdpFromZitadel(sub).catch(e =>
                console.error('[auth] syncIdp error:', e)
            );
        }

        // Sync profile picture from Zitadel metadata if not already stored (fallback)
        if (!existing?.oauthProfileImage && !oauthPicture) {
            syncPictureFromZitadel(sub).catch(e =>
                console.error('[auth] syncPicture error:', e)
            );
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
                    authProvider: 'internal',
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
