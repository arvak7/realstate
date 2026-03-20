import { ClauseDefinition, ClauseCheckContext } from './types';

/**
 * Clause: buyer must have verified their identity.
 * Checks User.identityVerified field.
 */
export const identityVerificationClause: ClauseDefinition = {
    id: 'identity_verification',
    i18nKey: 'clauses.identityVerification',
    enabled: false,
    checkSatisfied: async (ctx: ClauseCheckContext): Promise<boolean> => {
        const user = await ctx.prisma.user.findUnique({
            where: { id: ctx.buyerId },
            select: { identityVerified: true },
        });
        return user?.identityVerified === true;
    },
};
