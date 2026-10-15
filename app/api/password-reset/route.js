import {NextResponse} from 'next/server';
import {z} from 'zod';
import bcrypt from 'bcrypt';
import connectToDatabase from '@/lib/mongoose';
import User from '@/models/User';
import {getClientIp, isRateLimited} from '@/lib/rateLimit';
import {hashResetToken} from '@/lib/passwordReset';

const schema = z.object({
    token: z.string().regex(/^[0-9a-f]{64}$/),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

// Completes an emailed reset link: sets the new password and signs out other sessions
export async function POST(request) {
    if (isRateLimited(`reset-complete:${getClientIp(request)}`, {limit: 10, windowMs: 60 * 60 * 1000})) {
        return NextResponse.json({error: 'Too many requests. Please try again later.'}, {status: 429});
    }

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
        const passwordIssue = parsed.error.issues.find((i) => i.path[0] === 'password');
        return NextResponse.json(
            {error: passwordIssue ? passwordIssue.message : 'This reset link is invalid or has expired.'},
            {status: 400}
        );
    }

    try {
        await connectToDatabase();
        const user = await User.findOne({
            passwordResetTokenHash: hashResetToken(parsed.data.token),
            passwordResetExpires: {$gt: new Date()},
        });
        if (!user) {
            return NextResponse.json({error: 'This reset link is invalid or has expired.'}, {status: 400});
        }

        // The User pre-save hook clears the token and records passwordChangedAt
        user.password = await bcrypt.hash(parsed.data.password, 10);
        await user.save();
        return NextResponse.json({success: true}, {status: 200});
    } catch (error) {
        console.error('Password reset error:', error);
        return NextResponse.json({error: 'Could not reset the password. Please try again.'}, {status: 500});
    }
}
