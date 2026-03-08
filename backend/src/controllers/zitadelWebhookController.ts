import { Request, Response } from 'express';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Lazily loaded Zitadel admin PAT
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

const ZITADEL_URL = process.env.ZITADEL_ISSUER || 'http://localhost:8080';

/**
 * Actions V2 "Function" webhook for complement token (preuserinfo / preaccesstoken).
 * Reads user metadata and returns picture claim if found.
 *
 * Request body from Zitadel:
 * {
 *   "fullMethod": "...",
 *   "instanceID": "...",
 *   "orgID": "...",
 *   "projectID": "...",
 *   "userID": "...",
 *   "userMetadata": [{ "key": "...", "value": "base64..." }],
 *   ...
 * }
 *
 * Response: { "append_claims": [{ "key": "picture", "value": "url" }] }
 */
export async function complementToken(req: Request, res: Response): Promise<void> {
    try {
        const body = req.body;
        // Log full body to understand Zitadel's actual payload structure
        console.log('[zitadel-webhook] complementToken FULL BODY:', JSON.stringify(body, null, 2));

        // Zitadel Actions V2 sends: { fullMethod, instanceID, orgID, userID, request, response, headers }
        const userId = body?.userID;
        let pictureUrl: string | null = null;

        // Try to find picture from the request's user metadata (sent by Zitadel in the request payload)
        const request = body?.request || {};
        const metadata = request?.userMetadata || request?.user_metadata
            || body?.userMetadata || body?.user_metadata || [];
        for (const entry of metadata) {
            if ((entry.key === 'picture' || entry.key === 'idpPicture') && entry.value) {
                try {
                    pictureUrl = Buffer.from(entry.value, 'base64').toString('utf-8');
                    if (pictureUrl.startsWith('"') && pictureUrl.endsWith('"')) {
                        pictureUrl = JSON.parse(pictureUrl);
                    }
                } catch {
                    pictureUrl = entry.value;
                }
                break;
            }
        }

        // Fallback: fetch metadata from Management API
        if (!pictureUrl && userId) {
            pictureUrl = await fetchPictureFromMetadata(userId);
        }

        if (pictureUrl) {
            console.log('[zitadel-webhook] Adding picture claim for user:', userId, 'url:', pictureUrl);
            res.json({
                append_claims: [{ key: 'picture', value: pictureUrl }],
            });
        } else {
            console.log('[zitadel-webhook] No picture found for user:', userId);
            res.json({});
        }
    } catch (err) {
        console.error('[zitadel-webhook] complementToken error:', err);
        res.json({});
    }
}

/**
 * Actions V2 "Response" webhook for RetrieveIdentityProviderIntent.
 * Captures the Google profile picture from the IdP response and stores
 * it in Zitadel user metadata for later use by the complement token webhook.
 *
 * The response body from RetrieveIdentityProviderIntent contains:
 * {
 *   "idpInformation": {
 *     "rawInformation": {
 *       "picture": "https://lh3.googleusercontent.com/...",
 *       "email": "...",
 *       "name": "..."
 *     },
 *     "idpId": "...",
 *     "userId": "...",
 *     "userName": "..."
 *   },
 *   "userId": "zitadel-user-id"  // exists if user already exists
 * }
 */
export async function captureIdpPicture(req: Request, res: Response): Promise<void> {
    try {
        const body = req.body;
        // Log full body to understand Zitadel's actual payload structure
        console.log('[zitadel-webhook] captureIdpPicture FULL BODY:', JSON.stringify(body, null, 2));

        // Zitadel Actions V2 wraps the API response in body.response
        const apiResponse = body?.response || body;

        // Extract picture from rawInformation (nested in response)
        const rawInfo = apiResponse?.idpInformation?.rawInformation
            || apiResponse?.idp_information?.raw_information;
        const picture = rawInfo?.picture;

        // userId can be at top level (Zitadel V2 envelope) or in the API response
        const userId = body?.userID || apiResponse?.userId || apiResponse?.user_id;

        console.log('[zitadel-webhook] picture:', picture, 'userId:', userId);

        if (picture && userId) {
            await storePictureMetadata(userId, picture);
            console.log('[zitadel-webhook] Stored Google picture for user:', userId);
        } else if (picture && !userId) {
            // User doesn't exist yet (first login). We'll try to capture it later.
            // Store in a temporary in-memory cache keyed by IdP user ID
            const idpUserId = body?.idpInformation?.userId
                || body?.response?.idpInformation?.userId;
            if (idpUserId) {
                pendingPictures.set(idpUserId, { picture, timestamp: Date.now() });
                console.log('[zitadel-webhook] Cached picture for new IdP user:', idpUserId);
            }
        }

        // Return original response unchanged
        res.json({});
    } catch (err) {
        console.error('[zitadel-webhook] captureIdpPicture error:', err);
        res.json({});
    }
}

// Temporary cache for pictures from first-time users (before Zitadel creates them)
const pendingPictures = new Map<string, { picture: string; timestamp: number }>();

// Clean up pending pictures older than 5 minutes
setInterval(() => {
    const cutoff = Date.now() - 5 * 60 * 1000;
    for (const [key, val] of pendingPictures) {
        if (val.timestamp < cutoff) pendingPictures.delete(key);
    }
}, 60_000);

async function fetchPictureFromMetadata(userId: string): Promise<string | null> {
    const pat = getAdminPat();
    if (!pat) return null;

    try {
        const res = await fetch(`${ZITADEL_URL}/management/v1/users/${userId}/metadata/_search`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${pat}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });
        if (!res.ok) return null;

        const data = await res.json() as {
            result?: Array<{ key: string; value: string }>;
        };

        for (const entry of data.result || []) {
            if ((entry.key === 'picture' || entry.key === 'idpPicture') && entry.value) {
                let pic = Buffer.from(entry.value, 'base64').toString('utf-8');
                if (pic.startsWith('"') && pic.endsWith('"')) {
                    try { pic = JSON.parse(pic); } catch {}
                }
                return pic;
            }
        }
    } catch (err) {
        console.error('[zitadel-webhook] fetchPictureFromMetadata error:', err);
    }
    return null;
}

async function storePictureMetadata(userId: string, pictureUrl: string): Promise<void> {
    const pat = getAdminPat();
    if (!pat) return;

    try {
        const encoded = Buffer.from(pictureUrl).toString('base64');
        await fetch(`${ZITADEL_URL}/management/v1/users/${userId}/metadata/picture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${pat}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ value: encoded }),
        });
    } catch (err) {
        console.error('[zitadel-webhook] storePictureMetadata error:', err);
    }
}
