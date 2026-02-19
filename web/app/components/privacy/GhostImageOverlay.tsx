"use client";

import { useTranslations } from "next-intl";

interface GhostImageOverlayProps {
    totalImages: number;
    isMainSlot?: boolean;
    onClick?: () => void;
    className?: string;
}

/**
 * Ghost overlay displayed in place of private property photos.
 * Shows a lock icon, "private photos" label, and image count.
 * Used in property detail pages (isMainSlot=true, 16/10 aspect)
 * and in listing cards (isMainSlot=false, 4/3 aspect).
 */
export default function GhostImageOverlay({
    totalImages,
    isMainSlot = false,
    onClick,
    className = "",
}: GhostImageOverlayProps) {
    const t = useTranslations("privatePhotos");

    return (
        <div
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick}
            onKeyDown={(e) => {
                if (onClick && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onClick();
                }
            }}
            className={`
                relative overflow-hidden rounded-2xl
                ${isMainSlot ? "aspect-[16/10]" : "aspect-[4/3]"}
                bg-gray-200 flex flex-col items-center justify-center
                group transition-transform duration-300 ease-out
                ${onClick ? "cursor-pointer hover:scale-[1.02]" : ""}
                ${className}
            `}
        >
            {/* Semi-transparent overlay */}
            <div
                className={`
                    absolute inset-0 bg-gray-800/40
                    transition-colors duration-300
                    ${onClick ? "group-hover:bg-gray-800/30" : ""}
                `}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-3 select-none">
                {/* Lock icon */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={`
                        text-white drop-shadow-lg
                        ${isMainSlot ? "w-12 h-12" : "w-8 h-8"}
                    `}
                    aria-hidden="true"
                >
                    <path
                        fillRule="evenodd"
                        d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                        clipRule="evenodd"
                    />
                </svg>

                {/* Private photos label */}
                <span
                    className={`
                        text-white font-semibold drop-shadow-md
                        ${isMainSlot ? "text-lg" : "text-sm"}
                    `}
                >
                    {t("title")}
                </span>

                {/* Image count */}
                {totalImages > 0 && (
                    <span
                        className={`
                            text-white/80 drop-shadow-sm
                            ${isMainSlot ? "text-sm" : "text-xs"}
                        `}
                    >
                        {t("imageCount", { count: totalImages })}
                    </span>
                )}
            </div>
        </div>
    );
}
