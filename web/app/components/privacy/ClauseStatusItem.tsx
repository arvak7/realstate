"use client";

import { useTranslations } from "next-intl";

interface ClauseStatusItemProps {
    clauseId: string;
    satisfied: boolean;
    icon: 'shield' | 'handshake';
}

export default function ClauseStatusItem({ clauseId, satisfied, icon }: ClauseStatusItemProps) {
    const t = useTranslations("clauses");

    // Extract the short key from clause id (e.g., 'identity_verification' -> 'identityVerification')
    const keyMap: Record<string, string> = {
        'identity_verification': 'identityVerification',
        'buyer_seller_match': 'buyerSellerMatch',
    };
    const key = keyMap[clauseId] || clauseId;

    const shieldIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.932 9.563 12.348a.749.749 0 00.374 0c5.499-1.416 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516 11.209 11.209 0 01-7.877-3.08z" clipRule="evenodd" />
        </svg>
    );

    const handshakeIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M7.493 18.5c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.125c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-2.2-.123z" />
        </svg>
    );

    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl ${satisfied ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className={`flex-shrink-0 ${satisfied ? 'text-green-600' : 'text-gray-400'}`}>
                {icon === 'shield' ? shieldIcon : handshakeIcon}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${satisfied ? 'text-green-800' : 'text-gray-700'}`}>
                    {t(`${key}.name`)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                    {t(`${key}.description`)}
                </p>
            </div>
            <div className="flex-shrink-0">
                {satisfied ? (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                    </svg>
                )}
            </div>
        </div>
    );
}
