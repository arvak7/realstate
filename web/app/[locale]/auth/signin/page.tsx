"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function SignInPage() {
    const [email, setEmail] = useState("demo@realstate.com");
    const [password, setPassword] = useState("demo123");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = () => {
        signIn("zitadel", { callbackUrl: "/" });
    };

    const handleDemoLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await signIn("demo", {
                email,
                password,
                callbackUrl: "/",
                redirect: true,
            });
        } catch (err) {
            setError("Error al iniciar sessió");
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

                    {/* Login via Zitadel (shows Google, internal login, and future providers) */}
                    <button
                        onClick={handleLogin}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-kindred-dark text-white rounded-xl hover:bg-kindred-dark/90 transition-colors mb-4"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Iniciar Sessió
                    </button>

                    <p className="text-xs text-kindred-gray text-center mb-4">
                        Accedeix amb Google, email o altres mètodes disponibles
                    </p>

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
                            <strong className="text-kindred-dark">Mode Demo:</strong> Qualsevol combinació d&apos;email i contrasenya funciona per provar la plataforma.
                        </p>
                    </div>

                    <p className="mt-8 text-center text-kindred-gray text-sm">
                        No tens compte?{" "}
                        <Link href="/auth/signup" className="text-kindred-dark font-medium hover:underline">
                            Registra&apos;t
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
