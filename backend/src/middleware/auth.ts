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
// Also extracts the Google profile picture from the IdP intent event store
// and stores it in Zitadel user metadata (so Complement Token action injects it into JWT).
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

        // Extract Google picture from the most recent IdP intent event in Zitadel's DB.
        // The idpintent.succeeded event contains the raw Google response (base64-encoded JSON
        // with User.picture field). This is the only reliable source of the Google profile photo.
        if (provider === 'google') {
            syncGooglePicture(userId, pat, issuer).catch(e =>
                console.error('[auth] syncGooglePicture error:', e));
        }
    } catch (err) {
        console.error('[auth] Failed to sync IdP from Zitadel:', err);
    }
}

// Extract Google picture URL from Zitadel's IdP intent events (via Admin API)
// and store it in user metadata so the Complement Token action injects it into JWT.
// Runs on every Google login to keep the picture up-to-date (non-blocking, ~1-2 API calls).
async function syncGooglePicture(userId: string, pat: string, issuer: string): Promise<void> {
    try {
        // Fetch the most recent idpintent.succeeded event from Zitadel's Admin API.
        // This contains the raw Google profile (with picture) from the latest login.
        const eventsRes = await fetch(`${issuer}/admin/v1/events/_search`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${pat}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ limit: 50, asc: false }),
        });
        if (!eventsRes.ok) return;

        const eventsData = await eventsRes.json() as {
            events?: Array<{ type?: { type?: string }; payload?: { userId?: string; idpUser?: string } }>;
        };

        const intentEvent = eventsData.events?.find(e =>
            e.type?.type === 'idpintent.succeeded' && e.payload?.userId === userId
        );
        if (!intentEvent?.payload?.idpUser) return;

        const idpUserJson = Buffer.from(intentEvent.payload.idpUser, 'base64').toString('utf-8');
        const idpUser = JSON.parse(idpUserJson) as { User?: { picture?: string } };
        const picture = idpUser.User?.picture;

        if (!picture?.startsWith('http')) return;

        // Check if the picture has changed (skip write if same URL)
        const existing = await prisma.user.findUnique({
            where: { id: userId },
            select: { oauthProfileImage: true },
        });
        if (existing?.oauthProfileImage === picture) return;

        // Update Zitadel metadata (Complement Token action reads this for JWT injection)
        const b64Value = Buffer.from(picture).toString('base64');
        await fetch(`${issuer}/management/v1/users/${userId}/metadata/picture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${pat}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ value: b64Value }),
        });

        // Update DB for immediate effect
        await prisma.user.update({
            where: { id: userId },
            data: { oauthProfileImage: picture },
        });

        console.log(`[auth] Google picture updated for user ${userId}`);
    } catch (err) {
        console.error('[auth] Failed to sync Google picture:', err);
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

// Fetch picture URL from Zitadel user metadata (set by V1 Action or Admin API).
async function fetchPictureFromMetadata(userId: string): Promise<string | null> {
    const pat = getAdminPat();
    if (!pat) return null;

    const issuer = process.env.ZITADEL_ISSUER || 'http://localhost:8080';
    try {
        const res = await fetch(`${issuer}/management/v1/users/${userId}/metadata/picture`, {
            headers: { 'Authorization': `Bearer ${pat}` },
        });
        if (!res.ok) return null;

        const data = await res.json() as { metadata?: { value?: string } };
        const b64 = data.metadata?.value;
        if (!b64) return null;

        // Zitadel stores metadata values as base64
        const decoded = Buffer.from(b64, 'base64').toString('utf-8');

        // V1 Actions wrap strings in extra quotes (Zitadel bug #8338)
        const cleaned = decoded.startsWith('"') && decoded.endsWith('"')
            ? decoded.slice(1, -1)
            : decoded;

        if (cleaned.startsWith('http')) return cleaned;
        return null;
    } catch {
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
    // 1. JWT picture claim (from Zitadel Action addPictureClaim)
    // 2. Zitadel user metadata "picture" (set by V1 Action captureIdpPicture or Admin API)
    // 3. Zitadel profile avatarUrl (if user uploaded one in Zitadel)
    const metadataPicture = await fetchPictureFromMetadata(sub);
    const oauthPicture = (typeof payload.picture === 'string' && payload.picture)
        ? payload.picture
        : (metadataPicture || zitadelProfile?.avatarUrl || null);

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
    return jwtCheck(req, res, async (err?: any) => {
        if (err) {
            return next(err);
        }

        const authReq = req as AuthenticatedRequest;
        const payload = authReq.auth?.payload;
        if (payload?.sub) {
            await provisionUser(payload.sub, payload as Record<string, unknown>)
                .catch(e => console.error('[auth] provisionUser error:', e));
        }
        next();
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
