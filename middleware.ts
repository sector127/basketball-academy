import {getToken} from "next-auth/jwt";
import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

export async function middleware(req: NextRequest) {
    const token = await getToken({req, secret: process.env.NEXTAUTH_SECRET});

    if (req.nextUrl.pathname.startsWith("/_next") || req.nextUrl.pathname.startsWith("/api")) {
        return NextResponse.next();
    }

    if (!token) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    const userRole = token.role as string | undefined;

    // Define role-based access rules
    const roleAccess: Record<string, RegExp> = {
        admin: /^\/dashboard(\/.*)?$/, // Admins can access everything under /dashboard
        coach: /^\/dashboard\/coach(?:\/.*)?$/, // Coaches can access only /dashboard/coach/*
        player: /^\/dashboard\/player(?:\/.*)?$/, // Players can access only /dashboard/player/*
        guardian: /^\/dashboard\/guardian(?:\/.*)?$/, // Guardians can access only /dashboard/guardian/*
    };

    // 🚀 **Auto-redirect user to their role-based dashboard if they visit `/dashboard`**
    if (req.nextUrl.pathname === "/dashboard" && userRole !== "admin") {
        const redirectUrl = new URL(`/dashboard/${userRole}`, req.url);
        console.log(`Redirecting ${userRole} to ${redirectUrl.pathname}`);
        return NextResponse.redirect(redirectUrl);
    }

    // Check if user's role is defined in access rules
    if (!userRole || !roleAccess[userRole]) {
        console.log("Unauthorized - Role Not Found in roleAccess");
        return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Check if user's role allows access to the requested path
    if (!roleAccess[userRole].test(req.nextUrl.pathname)) {
        console.log("Unauthorized - Path Not Allowed");
        return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    console.log("Access Granted");
    return NextResponse.next();
}

// Apply middleware to all dashboard routes
export const config = {
    matcher: ["/dashboard/:path*"],
};
