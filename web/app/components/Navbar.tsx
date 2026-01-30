"use client";

import Link from "next/link";
import { useSession, signOut, signIn } from "next-auth/react";

export default function Navbar() {
    const { data: session } = useSession();

    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center">
                        <span className="text-2xl font-bold text-blue-600">
                            RealEstate
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center gap-6">
                        <Link
                            href="/properties"
                            className="text-gray-700 hover:text-blue-600 font-medium transition"
                        >
                            Immobles
                        </Link>

                        {session ? (
                            <>
                                <Link
                                    href="/properties/new"
                                    className="text-gray-700 hover:text-blue-600 font-medium transition"
                                >
                                    Publicar
                                </Link>
                                <Link
                                    href="/dashboard/properties"
                                    className="text-gray-700 hover:text-blue-600 font-medium transition"
                                >
                                    Les Meves Propietats
                                </Link>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-600">
                                        {session.user?.email}
                                    </span>
                                    <button
                                        onClick={() => signOut()}
                                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                                    >
                                        Tancar Sessió
                                    </button>
                                </div>
                            </>
                        ) : (
                            <button
                                onClick={() => signIn()}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
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
