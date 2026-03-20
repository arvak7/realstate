export interface ClauseFrontend {
    id: string;
    i18nKey: string;
    icon: 'shield' | 'handshake';
    order: number;
    // What action type the buyer needs to take
    actionType: 'external' | 'in-app';
    // Whether this clause is available for selection (disabled = hidden from selector UI)
    enabled: boolean;
}

export interface ClauseStatus {
    id: string;
    satisfied: boolean;
}
