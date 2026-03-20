import { ClauseDefinition, ClauseCheckContext } from './types';

/**
 * Clause: buyer and seller must have a mutually accepted contact.
 * Checks Contact with status 'accepted' for this property.
 */
export const buyerSellerMatchClause: ClauseDefinition = {
    id: 'buyer_seller_match',
    i18nKey: 'clauses.buyerSellerMatch',
    enabled: true,
    checkSatisfied: async (ctx: ClauseCheckContext): Promise<boolean> => {
        const contact = await ctx.prisma.contact.findFirst({
            where: {
                propertyId: ctx.propertyId,
                userId: ctx.buyerId,
                status: 'accepted',
            },
        });
        return contact !== null;
    },
};
