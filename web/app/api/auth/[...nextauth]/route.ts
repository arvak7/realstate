import NextAuth, { NextAuthOptions } from "next-auth";
import ZitadelProvider from "next-auth/providers/zitadel";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Fetch user data from backend /me endpoint
async function fetchUserData(accessToken: string) {
    try {
        const res = await fetch(`${API_URL}/me`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (res.ok) return await res.json();
    } catch (e) {
        console.error('[auth] Failed to fetch /me:', e);
    }
    return null;
}

export const authOptions: NextAuthOptions = {
    providers: [
        ZitadelProvider({
            issuer: process.env.ZITADEL_ISSUER || "http://localhost:8080",
            clientId: process.env.ZITADEL_CLIENT_ID || "",
            clientSecret: process.env.ZITADEL_CLIENT_SECRET || "",
            authorization: {
                params: {
                    scope: "openid profile email offline_access",
                },
            },
            // Map Zitadel profile claims to NextAuth user object.
            // The picture claim comes from Zitadel's userinfo (if available via Actions).
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name || profile.preferred_username,
                    email: profile.email,
                    image: profile.picture || null,
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === 'zitadel' && profile) {
                const p = profile as Record<string, unknown>;
                // Picture from Zitadel userinfo (via Action or profile callback)
                const picture = (typeof p.picture === 'string' && p.picture)
                    ? p.picture
                    : (typeof user.image === 'string' ? user.image : null);
                if (picture) {
                    user.oauthProfileImage = picture;
                }
            }
            return true;
        },

        async jwt({ token, user, account, trigger }) {
            // On initial sign-in: store tokens and user data
            if (account) {
                token.accessToken = account.access_token;
                token.idToken = account.id_token;
                token.refreshToken = account.refresh_token;
                token.expiresAt = account.expires_at;
            }
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.oauthProfileImage = user.oauthProfileImage;
            }

            // Refresh expired Zitadel access token
            if (token.expiresAt && typeof token.expiresAt === 'number' && Date.now() / 1000 > token.expiresAt - 60) {
                if (token.refreshToken) {
                    try {
                        const issuer = process.env.ZITADEL_ISSUER || "http://localhost:8080";
                        const response = await fetch(`${issuer}/oauth/v2/token`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: new URLSearchParams({
                                grant_type: 'refresh_token',
                                refresh_token: token.refreshToken as string,
                                client_id: process.env.ZITADEL_CLIENT_ID || '',
                                client_secret: process.env.ZITADEL_CLIENT_SECRET || '',
                            }),
                        });
                        if (response.ok) {
                            const refreshed = await response.json();
                            token.accessToken = refreshed.access_token;
                            token.expiresAt = Math.floor(Date.now() / 1000) + refreshed.expires_in;
                            if (refreshed.refresh_token) {
                                token.refreshToken = refreshed.refresh_token;
                            }
                        } else {
                            console.error('[auth] Token refresh failed:', response.status);
                        }
                    } catch (error) {
                        console.error('[auth] Token refresh error:', error);
                    }
                }
            }

            // Fetch user data from backend on sign-in or session update
            if ((account?.provider === 'zitadel' || trigger === 'update') && token.accessToken) {
                const userData = await fetchUserData(token.accessToken as string);
                if (userData) {
                    token.profilePhotoUrl = userData.profilePhotoUrl || null;
                    token.authProvider = userData.authProvider || null;
                    // Prefer OIDC-captured picture over DB value (fresh from Google)
                    if (!token.oauthProfileImage && userData.oauthProfileImage) {
                        token.oauthProfileImage = userData.oauthProfileImage;
                    }
                }
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.profilePhotoUrl = token.profilePhotoUrl;
                session.user.oauthProfileImage = token.oauthProfileImage;
                session.user.authProvider = token.authProvider;
                session.user.effectiveProfileImage =
                    (token.profilePhotoUrl || token.oauthProfileImage || null) as string | null;
            }
            // accessToken needed for API calls from the client
            session.accessToken = token.accessToken as string;
            // idToken needed for OIDC logout (end_session with id_token_hint)
            session.idToken = token.idToken as string;
            return session;
        },
    },
    pages: {
        signIn: "/auth/signin",
    },
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
