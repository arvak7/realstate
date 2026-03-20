import { ClauseFrontend } from './types';

const clauseRegistry: ClauseFrontend[] = [
    {
        id: 'identity_verification',
        i18nKey: 'clauses.identityVerification',
        icon: 'shield',
        order: 1,
        actionType: 'external',
        enabled: false,
    },
    {
        id: 'buyer_seller_match',
        i18nKey: 'clauses.buyerSellerMatch',
        icon: 'handshake',
        order: 2,
        actionType: 'in-app',
        enabled: true,
    },
];

export function getClauseFrontend(id: string): ClauseFrontend | undefined {
    return clauseRegistry.find((c) => c.id === id);
}

export function getAllClausesFrontend(): ClauseFrontend[] {
    return [...clauseRegistry]
        .filter((c) => c.enabled)
        .sort((a, b) => a.order - b.order);
}

export type { ClauseFrontend, ClauseStatus } from './types';
