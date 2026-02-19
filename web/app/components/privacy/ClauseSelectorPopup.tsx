"use client";

import { useTranslations } from "next-intl";
import { getAllClausesFrontend } from "@/app/lib/clauses";
import type { ClauseFrontend } from "@/app/lib/clauses";

interface ClauseSelectorPopupProps {
  selectedClauses: string[];
  onChange: (clauses: string[]) => void;
  onClose: () => void;
}

function ClauseIcon({ icon }: { icon: ClauseFrontend["icon"] }) {
  if (icon === "shield") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-5 h-5"
      >
        <path
          fillRule="evenodd"
          d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.932 9.563 12.348a.749.749 0 00.374 0c5.499-1.416 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516 11.209 11.209 0 01-7.877-3.08z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  // handshake
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M7.493 18.5c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.125c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-2.2-.123z" />
    </svg>
  );
}

export default function ClauseSelectorPopup({
  selectedClauses,
  onChange,
  onClose,
}: ClauseSelectorPopupProps) {
  const t = useTranslations("clauses");
  const clauses = getAllClausesFrontend();
  const noneSelected = selectedClauses.length === 0;

  function handleToggle(clauseId: string) {
    if (selectedClauses.includes(clauseId)) {
      onChange(selectedClauses.filter((id) => id !== clauseId));
    } else {
      onChange([...selectedClauses, clauseId]);
    }
  }

  function handleConfirm() {
    if (!noneSelected) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        // Close on overlay click
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("selectorTitle")}
        </h3>

        {/* Clause list */}
        <div className="space-y-3 mb-5">
          {clauses.map((clause) => {
            const key = clause.i18nKey.split(".")[1];
            const isSelected = selectedClauses.includes(clause.id);

            return (
              <label
                key={clause.id}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  isSelected
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggle(clause.id)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span
                  className={`flex-shrink-0 mt-0.5 ${
                    isSelected ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  <ClauseIcon icon={clause.icon} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {t(`${key}.name`)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t(`${key}.description`)}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        {/* Warning if none selected */}
        {noneSelected && (
          <p className="text-xs text-amber-600 mb-4">
            {t("minOneRequired")}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={noneSelected}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
