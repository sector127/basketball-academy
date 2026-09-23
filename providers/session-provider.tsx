"use client"; // Mark this as a Client Component (required for Next.js 13+)

import {SessionProvider} from "next-auth/react";
import {ReactNode} from "react";

interface SessionProviderProps {
    children: ReactNode;
    session?: any; // Adjust the type based on your session object
}

export default function AuthSessionProvider({children, session}: SessionProviderProps) {
    return (
        <SessionProvider session={session} refetchInterval={5 * 60} refetchOnWindowFocus={true}>
            {children}
        </SessionProvider>
    );
}