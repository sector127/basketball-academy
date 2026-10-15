import NextAuth, {CredentialsSignin} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {getUserByEmail, verifyPassword} from "@/lib/user"; // Assume verifyPassword handles hashing and validation

// Shown on the login page as "waiting for approval"; only sent after the password matched
class PendingApprovalError extends CredentialsSignin {
    code = "pending_approval";
}

export const {handlers, signIn, signOut, auth} = NextAuth({
    trustHost: true,
    providers: [
        CredentialsProvider({
            credentials: {
                email: {label: "Email", type: "text", placeholder: "your-email@example.com"},
                password: {label: "Password", type: "password"},
            },
            // Returning null signals bad credentials (CredentialsSignin). Thrown errors are
            // reported by Auth.js as a "Configuration" error, so only infrastructure failures throw.
            async authorize(credentials) {
                const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
                const password = typeof credentials?.password === "string" ? credentials.password : "";
                if (!email || !password) {
                    return null;
                }

                const user = await getUserByEmail(email);
                if (!user) {
                    return null;
                }

                const isValidPassword = await verifyPassword(password, user.password);
                if (!isValidPassword) {
                    return null;
                }
                if (user.pendingApproval) {
                    throw new PendingApprovalError();
                }
                if (user.isActive === false) {
                    return null;
                }

                // Return plain user object
                return {
                    id: user._id.toString(),
                    name: `${user.name || ''} ${user.lastName || ''}`.trim() || user.name || 'User',
                    email: user.email,
                    role: user.role,
                    image: user.image || null,
                };
            },
        }),
    ],
    pages: {
        signIn: "/login", // Custom sign-in page
        error: "/login", // Auth errors are shown on the sign-in page
    },
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    callbacks: {
        async session({session, token}) {
            session.user.id = token.sub; // Attach user ID to session
            session.user.role = token.role; // Attach user role to session
            session.authTime = token.authTime as number | undefined; // When the user signed in (checked against password changes)
            return session;
        },
        async jwt({token, user}) {
            if (user) {
                token.sub = user.id;
                token.role = user.role;
                // Set only at sign-in; `iat` can't be used because it's refreshed on every re-encode
                token.authTime = Date.now();
            }
            return token;
        },
    },
});
