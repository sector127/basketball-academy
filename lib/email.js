import nodemailer from 'nodemailer';

// Email is optional. Configure SMTP_URL (e.g. smtps://user:pass@smtp.example.com:465)
// and EMAIL_FROM to send real mail, or EMAIL_TRANSPORT=console to print emails to
// the server log during development.
let transporter = null;

function getTransporter() {
    if (transporter) return transporter;
    if (process.env.EMAIL_TRANSPORT === 'console') {
        transporter = nodemailer.createTransport({jsonTransport: true});
    } else if (process.env.SMTP_URL) {
        transporter = nodemailer.createTransport(process.env.SMTP_URL);
    }
    return transporter;
}

export function isEmailConfigured() {
    return process.env.EMAIL_TRANSPORT === 'console' || Boolean(process.env.SMTP_URL);
}

/**
 * Public base URL used in emailed links. Taken from configuration only: building it
 * from the request's Host header would let an attacker point reset links at their own site.
 */
export function getAppUrl() {
    const url = process.env.APP_URL || process.env.AUTH_URL || process.env.NEXTAUTH_URL;
    return url ? url.replace(/\/+$/, '') : null;
}

export async function sendEmail({to, subject, text}) {
    const transport = getTransporter();
    if (!transport) throw new Error('Email is not configured');
    const info = await transport.sendMail({
        from: process.env.EMAIL_FROM || 'Brooklyn Basketball Academy <no-reply@bba.ge>',
        to,
        subject,
        text,
    });
    if (process.env.EMAIL_TRANSPORT === 'console') {
        const message = JSON.parse(info.message);
        console.log(`[email] to=${message.to.map((t) => t.address).join(',')} subject="${message.subject}"\n${message.text}`);
    }
    return info;
}
