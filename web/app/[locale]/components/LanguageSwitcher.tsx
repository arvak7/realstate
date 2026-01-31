"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { useState, useRef, useEffect } from "react";

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLocaleChange = (newLocale: Locale) => {
        router.replace(pathname, { locale: newLocale });
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-kindred-gray hover:text-kindred-dark transition-colors rounded-lg hover:bg-neutral-warm"
            >
                <span className="uppercase">{locale}</span>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 py-2 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                    {locales.map((loc) => (
                        <button
                            key={loc}
                            onClick={() => handleLocaleChange(loc)}
                            className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                                loc === locale
                                    ? "text-kindred-dark font-semibold bg-neutral-warm/50"
                                    : "text-kindred-gray hover:text-kindred-dark hover:bg-neutral-warm/30"
                            }`}
                        >
                            {localeNames[loc]}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
