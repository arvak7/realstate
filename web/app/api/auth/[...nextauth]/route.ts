import NextAuth, { NextAuthOptions } from "next-auth";
import ZitadelProvider from "next-auth/providers/zitadel";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
    providers: [
        // Zitadel OIDC Provider (ACTIU amb HTTPS)
        ZitadelProvider({
            issuer: process.env.ZITADEL_ISSUER || "https://localhost:8080",
            clientId: process.env.ZITADEL_CLIENT_ID || "",
            clientSecret: process.env.ZITADEL_CLIENT_SECRET || "",
            authorization: {
                params: {
                    scope: "openid profile email",
                },
            },
        }),
        // Google OAuth Provider
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            authorization: {
                params: {
                    scope: "openid profile email",
                    prompt: "consent",
                    access_type: "offline",
                },
            },
        }),
        // Credentials Provider (fallback per testing)
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
                    // Intentar obtenir usuari real del backend
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
                    console.error('Error obtenint usuari:', error);
                }

                // Fallback si backend no disponible
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
            // Capturar imatge OAuth de proveïdors externs
            if (account?.provider && account.provider !== 'demo' && profile) {
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
                token.idToken = account.id_token;

                // Inject demo token for demo provider
                if (account.provider === 'demo') {
                    token.accessToken = 'demo-token';
                }
            }
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.profilePhotoUrl = user.profilePhotoUrl;
                token.oauthProfileImage = (user as any).oauthProfileImage;
            }
            // Refrescar sessió quan s'actualitza
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
                    console.error('Error refrescant dades usuari:', error);
                }
            }
            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id as string;
                (session.user as any).profilePhotoUrl = token.profilePhotoUrl;
                (session.user as any).oauthProfileImage = token.oauthProfileImage;
                // Prioritat: imatge local > imatge OAuth
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
