import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import User from '@/models/User';
import type { Session } from 'next-auth';

export type AuthSuccessResult = {
  session: Session;
  errorResponse?: never;
};

export type AuthErrorResult = {
  session?: never;
  errorResponse: NextResponse;
};

export type AuthResult = AuthSuccessResult | AuthErrorResult;

/**
 * Require authentication and optional role-based authorization for route handlers.
 * The user is re-loaded from the database on every call so that disabled accounts
 * and role changes take effect immediately, even for existing sessions.
 * @param allowedRoles - Optional list of allowed roles (e.g. ['admin'], ['admin', 'coach'])
 */
export async function requireAuth(allowedRoles: string[] | null = null): Promise<AuthResult> {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return {
        errorResponse: NextResponse.json(
          { success: false, error: 'Unauthorized - Please log in' },
          { status: 401 }
        ),
      };
    }

    await connectToDatabase();
    const user = await User.findById(session.user.id).select('role isActive passwordChangedAt').lean();
    // Sessions from before the last password change are no longer valid
    const signedInBeforePasswordChange =
      user?.passwordChangedAt &&
      (!session.authTime || session.authTime < new Date(user.passwordChangedAt).getTime());
    if (!user || user.isActive === false || signedInBeforePasswordChange) {
      return {
        errorResponse: NextResponse.json(
          { success: false, error: 'Unauthorized - Account is disabled or no longer exists' },
          { status: 401 }
        ),
      };
    }

    const userRole = (user.role || 'staff').toLowerCase();
    session.user.role = userRole;

    if (allowedRoles && allowedRoles.length > 0) {
      const normalizedRoles = allowedRoles.map((r) => r.toLowerCase());
      if (!normalizedRoles.includes(userRole) && userRole !== 'admin') {
        return {
          errorResponse: NextResponse.json(
            { success: false, error: 'Forbidden - Insufficient permissions' },
            { status: 403 }
          ),
        };
      }
    }

    return { session };
  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Authentication check failed' },
        { status: 500 }
      ),
    };
  }
}
