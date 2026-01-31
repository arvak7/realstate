"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const t = useTranslations("footer");

    return (
        <footer className="bg-kindred-dark text-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <h3 className="text-2xl font-bold mb-6">Immobles</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            {t("tagline")}
                        </p>
                    </div>

                    {/* Propietats */}
                    <div>
                        <h4 className="font-semibold mb-5 text-white">{t("properties.title")}</h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/properties" className="text-white/60 hover:text-white transition-colors duration-200">
                                    {t("properties.explore")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/properties/new" className="text-white/60 hover:text-white transition-colors duration-200">
                                    {t("properties.publish")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/properties?type=lloguer" className="text-white/60 hover:text-white transition-colors duration-200">
                                    {t("properties.rent")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/properties?type=venda" className="text-white/60 hover:text-white transition-colors duration-200">
                                    {t("properties.sale")}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Empresa */}
                    <div>
                        <h4 className="font-semibold mb-5 text-white">{t("company.title")}</h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/about" className="text-white/60 hover:text-white transition-colors duration-200">
                                    {t("company.about")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-white/60 hover:text-white transition-colors duration-200">
                                    {t("company.contact")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/faq" className="text-white/60 hover:text-white transition-colors duration-200">
                                    {t("company.faq")}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-semibold mb-5 text-white">{t("legal.title")}</h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/privacy" className="text-white/60 hover:text-white transition-colors duration-200">
                                    {t("legal.privacy")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-white/60 hover:text-white transition-colors duration-200">
                                    {t("legal.terms")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/cookies" className="text-white/60 hover:text-white transition-colors duration-200">
                                    {t("legal.cookies")}
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/10">
                    <p className="text-sm text-white/40">
                        ©{currentYear} Immobles. {t("copyright")}
                    </p>
                </div>
            </div>
        </footer>
    );
}
