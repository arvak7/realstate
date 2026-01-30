"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Real Estate POC
                    </h1>
                    <p className="text-gray-600">Inicia sessió per continuar</p>
                </div>

                {/* Zitadel OIDC Login */}
                <div className="mb-6">
                    <button
                        onClick={handleZitadelLogin}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-md"
                    >
                        🔐 Iniciar Sessió amb Zitadel
                    </button>
                </div>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">o bé</span>
                    </div>
                </div>

                {/* Demo Login */}
                <form onSubmit={handleDemoLogin} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email (Demo)
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            placeholder="demo@realstate.com"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Contrasenya (Demo)
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Iniciant sessió..." : "Login Demo (sense OIDC)"}
                    </button>
                </form>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-700 font-semibold mb-2">
                        ℹ️ Opcions de Login
                    </p>
                    <p className="text-xs text-gray-600">
                        <strong>Zitadel:</strong> Autenticació OIDC real (requereix configuració)
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                        <strong>Demo:</strong> Qualsevol email/password funciona
                    </p>
                </div>
            </div>
        </div>
    );
}
