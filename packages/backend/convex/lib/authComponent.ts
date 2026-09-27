import { createClient } from '@convex-dev/better-auth';
import { components } from '../_generated/api';
import type { DataModel } from '../_generated/dataModel';

// Shared by auth configuration and owner checks without a circular import.
export const authComponent = createClient<DataModel>(components.betterAuth);
export const OWNER_GITHUB_ID = '168853630'; // appadook; immutable GitHub identity
