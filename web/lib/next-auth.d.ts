import "next-auth";

declare module "next-auth" {
    interface User {
        id?: string;
        profilePhotoUrl?: string | null;
        oauthProfileImage?: string | null;
    }

    interface Session {
        user?: {
            id?: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            profilePhotoUrl?: string | null;
            oauthProfileImage?: string | null;
            effectiveProfileImage?: string | null;
        };
        accessToken?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        accessToken?: string;
        idToken?: string;
        profilePhotoUrl?: string | null;
        oauthProfileImage?: string | null;
    }
}
