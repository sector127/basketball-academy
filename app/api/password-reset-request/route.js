import {NextResponse} from 'next/server';
import {z} from 'zod';
import connectToDatabase from '@/lib/mongoose';
import User from '@/models/User';
import {getClientIp, isRateLimited} from '@/lib/rateLimit';
import {getAppUrl, isEmailConfigured, sendEmail} from '@/lib/email';
import {createResetToken} from '@/lib/passwordReset';

// "Forgot password". With email configured, sends a one-time reset link.
// Otherwise the account is flagged and an admin sets a new password on the Accounts page.
export async function POST(request) {
    if (isRateLimited(`reset:${getClientIp(request)}`, {limit: 5, windowMs: 60 * 60 * 1000})) {
        return NextResponse.json({error: 'Too many requests. Please try again later.'}, {status: 429});
    }

    const parsed = z.object({email: z.string().trim().toLowerCase().email()}).safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({error: 'Please enter a valid email address.'}, {status: 400});
    }

    try {
        await connectToDatabase();
        const user = await User.findOne({email: parsed.data.email, pendingApproval: {$ne: true}})
            .collation({locale: 'en', strength: 2});

        if (user && user.isActive !== false) {
            const appUrl = getAppUrl();
            if (isEmailConfigured() && appUrl) {
                const {token, tokenHash, expiresAt} = createResetToken();
                user.passwordResetTokenHash = tokenHash;
                user.passwordResetExpires = expiresAt;
                await user.save();
                await sendEmail({
                    to: user.email,
                    subject: 'Reset your Brooklyn Basketball Academy password',
                    text: [
                        `Hi ${user.name},`,
                        '',
                        'Use this link to choose a new password. It works once and expires in 1 hour:',
                        `${appUrl}/resetPassword?token=${token}`,
                        '',
                        "If you didn't ask for this, you can ignore this email.",
                    ].join('\n'),
                });
            } else {
                user.passwordResetRequestedAt = new Date();
                await user.save();
            }
        }
        // Same response whether or not the account exists
        return NextResponse.json({success: true}, {status: 200});
    } catch (error) {
        console.error('Password reset request error:', error);
        return NextResponse.json({error: 'Request failed. Please try again.'}, {status: 500});
    }
}
