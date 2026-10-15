import mongoose from 'mongoose';
import Player from '@/models/Player';
import type { UserRole } from '@/models/User';

// Accounts managed on the admin Accounts page; coaches have their own page
// and admins are managed by hand
export const MANAGED_ROLES: readonly UserRole[] = ['staff', 'player', 'guardian'] as const;

/**
 * Returns the IDs if every one is an existing player, otherwise null.
 */
export async function validatePlayerIds(ids: (string | mongoose.Types.ObjectId)[]): Promise<string[] | null> {
  const unique = [...new Set(ids.map(String))];
  if (unique.some((id) => !mongoose.Types.ObjectId.isValid(id))) return null;
  const count = await Player.countDocuments({ _id: { $in: unique } });
  return count === unique.length ? unique : null;
}
