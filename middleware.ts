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
        admin: /^\/dashboard(\/.*)?$/,
        // Staff have read-only access to the admin overview pages (see navConfig.staff);
        // create/edit pages are admin-only. The universal /dashboard/calendar and
        // /dashboard/games pages just redirect to the admin versions.
        staff: /^\/dashboard(?:\/admin)?(?:\/(?:teams|games|calendar|venues)(?:\/(?!create(?:\/|$)|edit(?:\/|$))[^/]+)*)?\/?$/,
        coach: /^\/dashboard\/coach(?:\/.*)?$/,
        player: /^\/dashboard\/player(?:\/.*)?$/,
        guardian: /^\/dashboard\/guardian(?:\/.*)?$/,
    };

    // Auto-redirect roles that have their own dashboard section to their role-specific paths
    const rolesWithOwnSection = ["coach", "player", "guardian"];
    if (userRole && rolesWithOwnSection.includes(userRole) && !req.nextUrl.pathname.startsWith(`/dashboard/${userRole}`)) {
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
        return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Check if user's role allows access to the requested path
    if (!roleAccess[userRole].test(req.nextUrl.pathname)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
}

// Apply middleware to all dashboard routes
export const config = {
    matcher: ["/dashboard/:path*"],
};
