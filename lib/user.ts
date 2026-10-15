import connectToDatabase from '@/lib/mongoose';
import User, { type IUser } from '@/models/User';
import bcrypt from 'bcrypt';
import type { HydratedDocument } from 'mongoose';

export const getUserByEmail = async (email: string): Promise<HydratedDocument<IUser> | null> => {
  try {
    // Connect to the database
    await connectToDatabase();

    // Fetch the user by email and include the 'preferences' field
    // Case-insensitive match so accounts stored with mixed-case emails still work
    const user = await User.findOne({ email }).collation({ locale: 'en', strength: 2 }).select('+preferences');

    // If no user is found, return null
    if (!user) {
      return null;
    }

    return user;
  } catch (error: unknown) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
};

export const verifyPassword = async (
  plaintextPassword?: string | null,
  hashedPassword?: string | null
): Promise<boolean> => {
  if (!plaintextPassword || !hashedPassword) {
    throw new Error('Both plaintextPassword and hashedPassword are required.');
  }
  return await bcrypt.compare(plaintextPassword, hashedPassword);
};
