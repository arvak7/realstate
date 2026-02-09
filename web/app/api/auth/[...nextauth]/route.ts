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
                    scope: "openid profile email offline_access",
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
            // Capture OAuth profile image from Zitadel (which may come from Google, Facebook, etc.)
            if (account?.provider === 'zitadel' && profile) {
                const oauthPicture = (profile as any).picture ||
                                     (profile as any).avatar_url ||
                                     (profile as any).image;
                if (oauthPicture) {
                    (user as any).oauthProfileImage = oauthPicture;
                }
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
