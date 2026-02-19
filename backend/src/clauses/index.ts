import { ClauseDefinition } from './types';
import { identityVerificationClause } from './identityVerification';
import { buyerSellerMatchClause } from './buyerSellerMatch';

// Registry of all available clauses
const clauseRegistry = new Map<string, ClauseDefinition>();

// Register built-in clauses
clauseRegistry.set(identityVerificationClause.id, identityVerificationClause);
clauseRegistry.set(buyerSellerMatchClause.id, buyerSellerMatchClause);

export function getClause(id: string): ClauseDefinition | undefined {
    return clauseRegistry.get(id);
}

export function getAllClauses(): ClauseDefinition[] {
    return Array.from(clauseRegistry.values());
}

export function getClauseIds(): string[] {
    return Array.from(clauseRegistry.keys());
}

export { clauseRegistry };
export type { ClauseDefinition, ClauseCheckContext } from './types';
