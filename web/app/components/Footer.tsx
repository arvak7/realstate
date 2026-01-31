"use client";

import Link from "next/link";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-kindred-dark text-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <h3 className="text-2xl font-bold mb-6">Immobles</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            La plataforma de confiança per trobar el teu proper llar.
                        </p>
                    </div>

                    {/* Propietats */}
                    <div>
                        <h4 className="font-semibold mb-5 text-white">Propietats</h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/properties" className="text-white/60 hover:text-white transition-colors duration-200">
                                    Explorar
                                </Link>
                            </li>
                            <li>
                                <Link href="/properties/new" className="text-white/60 hover:text-white transition-colors duration-200">
                                    Publicar
                                </Link>
                            </li>
                            <li>
                                <Link href="/properties?type=lloguer" className="text-white/60 hover:text-white transition-colors duration-200">
                                    Lloguer
                                </Link>
                            </li>
                            <li>
                                <Link href="/properties?type=venda" className="text-white/60 hover:text-white transition-colors duration-200">
                                    Venda
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Empresa */}
                    <div>
                        <h4 className="font-semibold mb-5 text-white">Empresa</h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/about" className="text-white/60 hover:text-white transition-colors duration-200">
                                    Sobre Nosaltres
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-white/60 hover:text-white transition-colors duration-200">
                                    Contacte
                                </Link>
                            </li>
                            <li>
                                <Link href="/faq" className="text-white/60 hover:text-white transition-colors duration-200">
                                    Preguntes Freqüents
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-semibold mb-5 text-white">Legal</h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/privacy" className="text-white/60 hover:text-white transition-colors duration-200">
                                    Privacitat
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-white/60 hover:text-white transition-colors duration-200">
                                    Termes i Condicions
                                </Link>
                            </li>
                            <li>
                                <Link href="/cookies" className="text-white/60 hover:text-white transition-colors duration-200">
                                    Política de Cookies
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/10">
                    <p className="text-sm text-white/40">
                        ©{currentYear} Immobles. Tots els drets reservats.
                    </p>
                </div>
            </div>
        </footer>
    );
}
