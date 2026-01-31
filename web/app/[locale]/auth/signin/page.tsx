"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
    const router = useRouter();
    const [email, setEmail] = useState("demo@realstate.com");
    const [password, setPassword] = useState("demo123");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleZitadelLogin = () => {
        signIn("zitadel", { callbackUrl: "/" });
    };

    const handleDemoLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn("demo", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Credencials incorrectes");
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (err) {
            setError("Error al iniciar sessió");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md">
                    <Link href="/" className="inline-block mb-12">
                        <span className="text-2xl font-bold text-kindred-dark">Immobles</span>
                    </Link>

                    <h1 className="text-3xl md:text-4xl text-kindred-dark mb-3">
                        Benvingut/da
                    </h1>
                    <p className="text-kindred-gray mb-10">
                        Inicia sessió per accedir al teu compte
                    </p>

                    {/* Zitadel OIDC Login */}
                    <button
                        onClick={handleZitadelLogin}
                        className="w-full btn-primary justify-center mb-4"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Iniciar Sessió amb Zitadel
                    </button>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-kindred-gray">o bé</span>
                        </div>
                    </div>

                    {/* Demo Login */}
                    <form onSubmit={handleDemoLogin} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-kindred-dark mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-kindred-dark/20 focus:border-kindred-dark outline-none transition-all"
                                placeholder="demo@realstate.com"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-kindred-dark mb-2">
                                Contrasenya
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-kindred-dark/20 focus:border-kindred-dark outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-outline justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Iniciant sessió..." : "Login Demo"}
                        </button>
                    </form>

                    <div className="mt-8 p-4 bg-neutral-warm/50 rounded-xl">
                        <p className="text-sm text-kindred-gray">
                            <strong className="text-kindred-dark">Mode Demo:</strong> Qualsevol combinació d'email i contrasenya funciona per provar la plataforma.
                        </p>
                    </div>

                    <p className="mt-8 text-center text-kindred-gray text-sm">
                        No tens compte?{" "}
                        <Link href="/auth/signup" className="text-kindred-dark font-medium hover:underline">
                            Registra't
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right: Image */}
            <div className="hidden lg:block lg:w-1/2 bg-neutral-warm">
                <div className="h-full w-full relative">
                    <img
                        src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=1600&fit=crop"
                        alt="Interior d'una llar"
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-kindred-dark/50 to-transparent"></div>
                    <div className="absolute bottom-12 left-12 right-12 text-white">
                        <h2 className="text-3xl mb-4">
                            Troba la teva propera llar
                        </h2>
                        <p className="text-white/80">
                            Descobreix propietats úniques a Catalunya i les Illes Balears amb total confiança.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
