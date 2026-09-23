import NextAuth, {DefaultSession} from "next-auth/next";

declare module "next-auth" {
    interface Session {
        user?: {
            name?: string | null
            email?: string | null
            image?: string | null
            role?: string // Add your role property here
        } & DefaultSession["user"]
    }

    interface User {
        role?: string // And here for the User type
    }
}