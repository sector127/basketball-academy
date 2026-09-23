import bcrypt from 'bcrypt';

/**
 * Hashes a plaintext password using bcrypt.
 * @param {string} plaintextPassword - The plaintext password to hash.
 * @returns {string} - The hashed password.
 */
export const saltAndHashPassword = (plaintextPassword: string): string => {
    // Generate a salt (a random string to add to the password before hashing)
    const saltRounds = 10; // Number of salt rounds (higher = more secure but slower)
    const salt = bcrypt.genSaltSync(saltRounds);

    // Hash the password with the salt
    const hashedPassword = bcrypt.hashSync(plaintextPassword, salt);

    return hashedPassword;
};

/**
 * Compares a plaintext password with a hashed password.
 * @param {string} plaintextPassword - The plaintext password to check.
 * @param {string} hashedPassword - The hashed password from the database.
 * @returns {boolean} - True if the passwords match, false otherwise.
 */
export const verifyPassword = (plaintextPassword: string, hashedPassword: string): boolean => {
    return bcrypt.compareSync(plaintextPassword, hashedPassword);
};