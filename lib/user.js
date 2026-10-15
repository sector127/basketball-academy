import connectToDatabase from "@/lib/mongoose";
import User from '@/models/User';
import bcrypt from "bcrypt";

export const getUserByEmail = async (email) => {
    try {
        // Connect to the database
        await connectToDatabase();

        // Fetch the user by email and include the 'preferences' field
        // Case-insensitive match so accounts stored with mixed-case emails still work
        const user = await User.findOne({email}).collation({locale: 'en', strength: 2}).select('+preferences');

        // If no user is found, return null or throw an error
        if (!user) {
            return null; // or throw new Error('User not found');
        }

        return user;
    } catch (error) {
        console.error('Error fetching user by email:', error);
        throw error; // Re-throw the error for handling upstream
    }
};

export const verifyPassword = async (plaintextPassword, hashedPassword) => {
    if (!plaintextPassword || !hashedPassword) {
        throw new Error("Both plaintextPassword and hashedPassword are required.");
    }
    return await bcrypt.compare(plaintextPassword, hashedPassword);
};