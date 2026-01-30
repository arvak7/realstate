"use client";

import Link from "next/link";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-primary-dark text-white/80 mt-20">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div className="col-span-1">
                        <h3 className="text-xl font-semibold text-white mb-4">RealEstate</h3>
                        <p className="text-sm text-white/60 leading-relaxed">
                            La teva plataforma de confiança per trobar l'immoble perfecte.
                        </p>
                    </div>

                    {/* Links - Propietats */}
                    <div>
                        <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Propietats</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/properties" className="hover:text-white transition-colors duration-300">
                                    Explorar Immobles
                                </Link>
                            </li>
                            <li>
                                <Link href="/properties/new" className="hover:text-white transition-colors duration-300">
                                    Publicar Immoble
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Links - Empresa */}
                    <div>
                        <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Empresa</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/about" className="hover:text-white transition-colors duration-300">
                                    Sobre Nosaltres
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="hover:text-white transition-colors duration-300">
                                    Contacte
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Links - Legal */}
                    <div>
                        <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Legal</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/privacy" className="hover:text-white transition-colors duration-300">
                                    Privacitat
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="hover:text-white transition-colors duration-300">
                                    Termes i Condicions
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/10">
                    <p className="text-center text-sm text-white/50">
                        © {currentYear} RealEstate. Tots els drets reservats.
                    </p>
                </div>
            </div>
        </footer>
    );
}
