import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "./models/User.js";
import connectToDatabase from "./lib/mongoose.js";

/**
 * Adds a user with a hashed password to the database.
 * @param {string} email - The user's email.
 * @param {string} name
 * @param {string} lastName
 * @param {string} plaintextPassword - The plaintext password to hash.
 * @param {string} role - The user's role (e.g., 'staff').
 */
const addUser = async (
  email,
  name,
  lastName,
  plaintextPassword,
  role = "staff",
) => {
  try {
    // Hash the password
    const saltRounds = 10; // Number of salt rounds
    const hashedPassword = await bcrypt.hash(plaintextPassword, saltRounds);

    // Connect to the database
    await connectToDatabase();

    // Check if a user with the given email already exists to avoid duplicate key errors
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`User ${email} already exists. Skipping creation.`);
      return;
    }

    // Create the user
    const user = new User({
      email,
      name,
      lastName,
      password: hashedPassword,
      role,
    });

    // Save the user to the database
    await user.save();
    console.log(`User ${email} (${role}) added successfully.`);
  } catch (error) {
    console.error("Error adding user:", error);
  }
};

const main = async () => {
  await addUser("admin@bba.ge", "Admin", "User", "admin123", "admin");
  await addUser("nika@bba.ge", "Nikoloz", "Mskhalaia", "password123", "coach");
  await mongoose.disconnect();
};

main();
