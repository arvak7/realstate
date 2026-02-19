"use client";

import { useTranslations } from "next-intl";

interface PrivatePropertyBadgeProps {
  variant: "overlay" | "inline";
  className?: string;
}

export default function PrivatePropertyBadge({
  variant,
  className = "",
}: PrivatePropertyBadgeProps) {
  const t = useTranslations("privatePhotos");

  // Small lock icon as inline SVG
  const lockIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-.5V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z"
        clipRule="evenodd"
      />
    </svg>
  );

  if (variant === "overlay") {
    return (
      <span
        className={`absolute bottom-3 left-3 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${className}`}
      >
        {lockIcon}
        {t("badge")}
      </span>
    );
  }

  // inline variant
  return (
    <span
      className={`inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {lockIcon}
      {t("badge")}
    </span>
  );
}
