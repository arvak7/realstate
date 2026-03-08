"use client";

import { signIn } from "next-auth/react";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Fallback sign-in page required by NextAuth (for error handling, route guards, etc.).
// Automatically redirects to Zitadel Login V2 without showing any UI.

function SignInContent() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    useEffect(() => {
        signIn("zitadel", { callbackUrl });
    }, [callbackUrl]);

    return null;
}

export default function SignInPage() {
    return (
        <Suspense>
            <SignInContent />
        </Suspense>
    );
}
