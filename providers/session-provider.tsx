"use client"; // Mark this as a Client Component (required for Next.js 13+)

import {SessionProvider} from "next-auth/react";
import type {Session} from "next-auth";
import {ReactNode} from "react";

interface SessionProviderProps {
    children: ReactNode;
    session?: Session | null;
}

export default function AuthSessionProvider({children, session}: SessionProviderProps) {
    return (
        <SessionProvider session={session} refetchInterval={5 * 60} refetchOnWindowFocus={true}>
            {children}
        </SessionProvider>
    );
}