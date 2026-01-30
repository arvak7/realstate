"use client";

import Link from "next/link";
import { useSession, signOut, signIn } from "next-auth/react";

export default function Navbar() {
    const { data: session } = useSession();

    return (
        <nav className="bg-primary-dark shadow-soft">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center">
                        <span className="text-2xl font-semibold text-white tracking-tight">
                            RealEstate
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center gap-8">
                        <Link
                            href="/properties"
                            className="text-white/80 hover:text-white font-medium transition-colors duration-300"
                        >
                            Immobles
                        </Link>

                        {session ? (
                            <>
                                <Link
                                    href="/properties/new"
                                    className="text-white/80 hover:text-white font-medium transition-colors duration-300"
                                >
                                    Publicar
                                </Link>
                                <Link
                                    href="/dashboard/properties"
                                    className="text-white/80 hover:text-white font-medium transition-colors duration-300"
                                >
                                    Les Meves Propietats
                                </Link>
                                <div className="flex items-center gap-4 ml-4">
                                    <span className="text-sm text-white/60">
                                        {session.user?.email}
                                    </span>
                                    <button
                                        onClick={() => signOut()}
                                        className="bg-white/10 text-white px-5 py-2 rounded-full hover:bg-white/20 transition-all duration-300 font-medium text-sm"
                                    >
                                        Tancar Sessió
                                    </button>
                                </div>
                            </>
                        ) : (
                            <button
                                onClick={() => signIn()}
                                className="bg-white text-primary-dark px-6 py-2.5 rounded-full font-semibold hover:bg-neutral-cream transition-all duration-300 shadow-soft"
                            >
                                Iniciar Sessió
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
