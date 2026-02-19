"use client";

import { Link } from "@/i18n/navigation";
import { useSession, signOut, signIn } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";
import UserAvatar from "../../components/UserAvatar";

export default function Navbar() {
    const { data: session } = useSession();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const t = useTranslations("nav");
    const tCommon = useTranslations("common");

    // Close user menu on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <nav className="bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center">
                        <span className="text-2xl font-bold text-kindred-dark tracking-tight">
                            {tCommon("brand")}
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link
                            href="/properties"
                            className="text-kindred-gray hover:text-kindred-dark font-medium transition-colors duration-200 px-3 py-2"
                        >
                            {t("explore")}
                        </Link>
                        {session && (
                            <Link
                                href="/properties/new"
                                className="text-kindred-gray hover:text-kindred-dark font-medium transition-colors duration-200 px-3 py-2"
                            >
                                {t("publish")}
                            </Link>
                        )}
                        {!session && (
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

                        {/* User menu dropdown (only when authenticated) */}
                        {session && (
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 p-1.5 hover:bg-neutral-warm rounded-lg transition-colors ml-1"
                                    aria-label={t("openMenu")}
                                >
                                    <UserAvatar
                                        photoUrl={session.user?.effectiveProfileImage}
                                        name={session.user?.name}
                                        size="sm"
                                    />
                                    <svg className="w-4 h-4 text-kindred-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                                        <div className="px-4 py-2 border-b border-gray-100">
                                            <p className="text-sm font-medium text-kindred-dark truncate">
                                                {session.user?.name || session.user?.email}
                                            </p>
                                            <p className="text-xs text-kindred-gray truncate">{session.user?.email}</p>
                                        </div>
                                        <Link
                                            href="/dashboard"
                                            className="block px-4 py-2.5 text-sm text-kindred-dark hover:bg-neutral-warm transition-colors"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            {t("dashboard")}
                                        </Link>
                                        <Link
                                            href="/profile"
                                            className="block px-4 py-2.5 text-sm text-kindred-dark hover:bg-neutral-warm transition-colors"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            {t("profile")}
                                        </Link>
                                        <div className="border-t border-gray-100 mt-1 pt-1">
                                            <button
                                                onClick={() => {
                                                    signOut();
                                                    setUserMenuOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                {t("signOut")}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
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
                                    <Link
                                        href="/dashboard"
                                        className="text-kindred-dark font-medium py-3 px-4 hover:bg-neutral-warm rounded-lg transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {t("dashboard")}
                                    </Link>
                                    <Link
                                        href="/profile"
                                        className="text-kindred-dark font-medium py-3 px-4 hover:bg-neutral-warm rounded-lg transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {t("profile")}
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
                                        className="text-left text-red-600 font-medium py-3 px-4 hover:bg-red-50 rounded-lg transition-colors"
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
