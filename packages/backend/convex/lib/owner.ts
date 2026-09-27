import { ConvexError } from 'convex/values';
import type { GenericCtx } from '@convex-dev/better-auth';
import type { DataModel } from '../_generated/dataModel';
import { components } from '../_generated/api';
import { authComponent, OWNER_GITHUB_ID } from './authComponent';

export async function requireOwner(ctx: GenericCtx<DataModel>) {
  // getAuthUser also verifies the session still exists and has not expired.
  const user = await authComponent.safeGetAuthUser(ctx);
  if (!user) throw new ConvexError('Unauthorized');
  const account = await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: 'account',
    where: [
      { field: 'providerId', value: 'github' },
      { field: 'accountId', value: OWNER_GITHUB_ID },
    ],
  });
  if (!account || !('userId' in account) || account.userId !== user._id)
    throw new ConvexError('Forbidden');
  return user;
}
