import NextAuth, { type DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    authTime?: number;
    user: {
      id?: string | null;
      role?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub?: string;
    role?: string;
    authTime?: number;
  }
}