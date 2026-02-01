"use client";

import { Link } from "@/i18n/navigation";
import { useSession, signOut, signIn } from "next-auth/react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";
import UserAvatar from "../../components/UserAvatar";

export default function Navbar() {
    const { data: session } = useSession();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const t = useTranslations("nav");

    return (
        <nav className="bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo - Kindred style bold text */}
                    <Link href="/" className="flex items-center">
                        <span className="text-2xl font-bold text-kindred-dark tracking-tight">
                            Immobles
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-4">
                        {session ? (
                            <>
                                <Link
                                    href="/properties"
                                    className="text-kindred-gray hover:text-kindred-dark font-medium transition-colors duration-200 px-3 py-2"
                                >
                                    {t("explore")}
                                </Link>
                                <Link
                                    href="/properties/new"
                                    className="text-kindred-gray hover:text-kindred-dark font-medium transition-colors duration-200 px-3 py-2"
                                >
                                    {t("publish")}
                                </Link>
                                <div className="flex items-center gap-3 px-3">
                                    <UserAvatar
                                        photoUrl={session.user?.effectiveProfileImage}
                                        name={session.user?.name}
                                        size="sm"
                                    />
                                    <span className="text-sm text-kindred-gray">
                                        {session.user?.name || session.user?.email}
                                    </span>
                                </div>
                                <button
                                    onClick={() => signOut()}
                                    className="btn-secondary text-sm py-2 px-5"
                                >
                                    {t("signOut")}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => signIn()}
                                    className="btn-secondary text-sm py-2 px-5"
                                >
                                    {t("signIn")}
                                </button>
                                <Link
                                    href="/properties"
                                    className="btn-primary text-sm py-2 px-5"
                                >
                                    {t("exploreProperties")}
                                </Link>
                            </>
                        )}

                        <LanguageSwitcher />

                        {/* Hamburger menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 hover:bg-neutral-warm rounded-lg transition-colors ml-2"
                            aria-label={t("openMenu")}
                        >
                            <svg className="w-6 h-6 text-kindred-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center gap-2">
                        <LanguageSwitcher />
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 hover:bg-neutral-warm rounded-lg transition-colors"
                            aria-label={t("toggleMenu")}
                        >
                            <svg className="w-6 h-6 text-kindred-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-100">
                        <div className="flex flex-col gap-2">
                            <Link
                                href="/properties"
                                className="text-kindred-dark font-medium py-3 px-4 hover:bg-neutral-warm rounded-lg transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {t("exploreProperties")}
                            </Link>
                            {session ? (
                                <>
                                    <Link
                                        href="/properties/new"
                                        className="text-kindred-dark font-medium py-3 px-4 hover:bg-neutral-warm rounded-lg transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {t("publish")}
                                    </Link>
                                    <div className="flex items-center gap-3 px-4 py-2">
                                        <UserAvatar
                                            photoUrl={session.user?.effectiveProfileImage}
                                            name={session.user?.name}
                                            size="sm"
                                        />
                                        <span className="text-sm text-kindred-gray">
                                            {session.user?.name || session.user?.email}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            signOut();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="text-left text-kindred-dark font-medium py-3 px-4 hover:bg-neutral-warm rounded-lg transition-colors"
                                    >
                                        {t("signOut")}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => {
                                        signIn();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="text-left text-kindred-dark font-medium py-3 px-4 hover:bg-neutral-warm rounded-lg transition-colors"
                                >
                                    {t("signIn")}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
