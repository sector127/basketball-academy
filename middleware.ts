import {getToken} from "next-auth/jwt";
import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

export async function middleware(req: NextRequest) {
    if (req.nextUrl.pathname.startsWith("/_next") || req.nextUrl.pathname.startsWith("/api") || req.nextUrl.pathname.startsWith("/static")) {
        return NextResponse.next();
    }

    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    const isSecure = req.nextUrl.protocol === "https:";
    const cookieName = isSecure
        ? "__Secure-authjs.session-token"
        : (req.cookies.get("authjs.session-token") ? "authjs.session-token" : "next-auth.session-token");

    const token = await getToken({
        req,
        secret,
        salt: cookieName,
        cookieName,
    });

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

    // Auto-redirect non-admin users to their role-specific dashboard paths
    if (userRole && userRole !== "admin" && !req.nextUrl.pathname.startsWith(`/dashboard/${userRole}`)) {
        const subPath = req.nextUrl.pathname.replace(/^\/dashboard\/?/, "");
        if (!subPath) {
            return NextResponse.redirect(new URL(`/dashboard/${userRole}`, req.url));
        }
        const commonSections = ["games", "calendar", "players", "teams", "combinations"];
        const firstSegment = subPath.split("/")[0];
        if (commonSections.includes(firstSegment)) {
            const redirectUrl = new URL(`/dashboard/${userRole}/${subPath}`, req.url);
            return NextResponse.redirect(redirectUrl);
        }
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
