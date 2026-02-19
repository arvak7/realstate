import NextAuth, { NextAuthOptions } from "next-auth";
import ZitadelProvider from "next-auth/providers/zitadel";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
    providers: [
        // Zitadel OIDC Provider (identity broker for all external IdPs: Google, Facebook, etc.)
        ZitadelProvider({
            issuer: process.env.ZITADEL_ISSUER || "http://localhost:8080",
            clientId: process.env.ZITADEL_CLIENT_ID || "",
            clientSecret: process.env.ZITADEL_CLIENT_SECRET || "",
            authorization: {
                params: {
                    scope: "openid profile email offline_access urn:zitadel:iam:user:metadata",
                },
            },
        }),
        // Credentials Provider (fallback for development/testing)
        CredentialsProvider({
            id: "demo",
            name: "Demo Login (POC)",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "demo@realstate.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                try {
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/me/internal/by-email?email=${encodeURIComponent(credentials.email)}`,
                        { headers: { 'x-internal-api-key': process.env.INTERNAL_API_KEY || '' } }
                    );

                    if (response.ok) {
                        const user = await response.json();
                        return {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            profilePhotoUrl: user.profilePhotoUrl,
                            oauthProfileImage: user.oauthProfileImage,
                        };
                    }
                } catch (error) {
                    console.error('Error fetching user:', error);
                }

                return {
                    id: "demo-user-id",
                    name: "Demo User",
                    email: credentials.email,
                    image: "https://i.pravatar.cc/150?u=" + credentials.email,
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === 'zitadel' && profile) {
                const p = profile as Record<string, unknown>;

                // 1) Standard OIDC picture claim (from Zitadel Actions complement token)
                let oauthPicture = (typeof p.picture === 'string') ? p.picture : '';

                // 2) Zitadel metadata object (from urn:zitadel:iam:user:metadata scope)
                //    Returned as { "urn:zitadel:iam:user:metadata": { picture: "base64...", ... } }
                if (!oauthPicture) {
                    const metaObj = p['urn:zitadel:iam:user:metadata'];
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

                // 3) Fallback to user.image (from NextAuth provider profile mapping)
                if (!oauthPicture && user.image) {
                    oauthPicture = user.image;
                }

                if (oauthPicture) {
                    (user as any).oauthProfileImage = oauthPicture;
                }

                // Debug logging (remove after confirming picture works)
                console.log('[auth-debug] signIn profile keys:', Object.keys(p).join(', '));
                console.log('[auth-debug] profile.picture:', p.picture);
                console.log('[auth-debug] metadata obj:', JSON.stringify(p['urn:zitadel:iam:user:metadata']));
                console.log('[auth-debug] user.image:', user.image);
                console.log('[auth-debug] resolved oauthPicture:', oauthPicture || '(none)');
            }
            return true;
        },

        async jwt({ token, user, account, trigger }) {
            if (account) {
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
                token.expiresAt = account.expires_at;

                if (account.provider === 'demo') {
                    token.accessToken = 'demo-token';
                    token.expiresAt = undefined;
                }
            }
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.profilePhotoUrl = user.profilePhotoUrl;
                token.oauthProfileImage = (user as any).oauthProfileImage;
                token.authProvider = (user as any).authProvider;
            }

            // On first Zitadel login, fetch user data from backend (oauthProfileImage + authProvider)
            if (account && account.provider === 'zitadel' && token.accessToken) {
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
                        headers: { 'Authorization': `Bearer ${token.accessToken}` },
                    });
                    if (res.ok) {
                        const userData = await res.json();
                        if (userData.oauthProfileImage) {
                            token.oauthProfileImage = userData.oauthProfileImage;
                        }
                        if (userData.authProvider) {
                            token.authProvider = userData.authProvider;
                        }
                    }
                } catch (e) {
                    console.error('[auth] Error fetching user data on login:', e);
                }
            }

            // Token refresh: if Zitadel access token is about to expire, refresh it
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

            // Refresh user data on session update trigger
            if (trigger === 'update' && token.accessToken) {
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
                        headers: { 'Authorization': `Bearer ${token.accessToken}` },
                    });
                    if (response.ok) {
                        const userData = await response.json();
                        token.profilePhotoUrl = userData.profilePhotoUrl;
                        token.oauthProfileImage = userData.oauthProfileImage;
                        token.authProvider = userData.authProvider;
                    }
                } catch (error) {
                    console.error('Error refreshing user data:', error);
                }
            }
            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id as string;
                (session.user as any).profilePhotoUrl = token.profilePhotoUrl;
                (session.user as any).oauthProfileImage = token.oauthProfileImage;
                (session.user as any).authProvider = token.authProvider;
                (session.user as any).effectiveProfileImage =
                    token.profilePhotoUrl || token.oauthProfileImage || null;
            }
            session.accessToken = token.accessToken as string;
            return session;
        },
    },
    pages: {
        signIn: "/ca/auth/signin",
    },
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
