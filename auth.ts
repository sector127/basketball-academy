import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {getUserByEmail, verifyPassword} from "@/lib/user"; // Assume verifyPassword handles hashing and validation

export const {handlers, signIn, signOut, auth} = NextAuth({
    providers: [
        CredentialsProvider({
            credentials: {
                email: {label: "Email", type: "text", placeholder: "your-email@example.com"},
                password: {label: "Password", type: "password"},
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required.");
                }

                // Fetch user by email
                const user = await getUserByEmail(credentials.email as string);


                if (!user) {
                    throw new Error("Invalid email or password.");
                }

                // Verify the password
                const isValidPassword = await verifyPassword(credentials.password, user.password);
                if (!isValidPassword) {
                    throw new Error("Invalid email or password.");
                }

                // Return user data
                return user;
            },
        }),
    ],
    pages: {
        signIn: "/login", // Custom sign-in page
        error: "/auth/error",  // Redirect to the sign-in page on error
    },
    secret: process.env.NEXTAUTH_SECRET, // Ensure this is set in your .env file
    callbacks: {
        async session({session, token}) {
            session.user.id = token.sub; // Attach user ID to session
            session.user.role = token.role; // Attach user role to session
            return session;
        },
        async jwt({token, user}) {
            if (user) {
                token.sub = user.id;
                token.role = user.role
            }
            return token;
        },
    },
});
