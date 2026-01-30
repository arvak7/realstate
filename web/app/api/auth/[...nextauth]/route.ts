import NextAuth, { NextAuthOptions } from "next-auth";
import ZitadelProvider from "next-auth/providers/zitadel";
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
        // Credentials Provider (fallback per testing)
        CredentialsProvider({
            id: "demo",
            name: "Demo Login (POC)",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "demo@realstate.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                // Mock authentication - NOMÉS PER POC
                if (credentials?.email && credentials?.password) {
                    return {
                        id: "demo-" + Date.now(),
                        name: "Demo User",
                        email: credentials.email,
                        image: "https://i.pravatar.cc/150?u=" + credentials.email,
                    };
                }
                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            if (account) {
                token.accessToken = account.access_token;
                token.idToken = account.id_token;
            }
            // Inject demo token for credentials provider
            if (user && user.email === 'demo@realstate.com') {
                token.accessToken = 'demo-token';
            }
            if (user) {
                token.id = user.id;
                token.email = user.email;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id as string;
            }
            session.accessToken = token.accessToken as string;
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
