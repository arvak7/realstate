import { PrismaClient } from '@prisma/client';

export interface ClauseCheckContext {
    prisma: PrismaClient;
    buyerId: string;
    sellerId: string;
    propertyId: string;
}

export interface ClauseDefinition {
    id: string;
    // i18n key used by frontend to display name/description
    i18nKey: string;
    // Check if this clause is satisfied for a given buyer
    checkSatisfied: (ctx: ClauseCheckContext) => Promise<boolean>;
}
