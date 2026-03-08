import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        accessToken?: string;
        idToken?: string;
        user: {
            id: string;
            profilePhotoUrl?: string | null;
            oauthProfileImage?: string | null;
            authProvider?: string | null;
            effectiveProfileImage?: string | null;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        profilePhotoUrl?: string | null;
        oauthProfileImage?: string | null;
        authProvider?: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id?: string;
        accessToken?: string;
        idToken?: string;
        refreshToken?: string;
        expiresAt?: number;
        profilePhotoUrl?: string | null;
        oauthProfileImage?: string | null;
        authProvider?: string | null;
    }
}
