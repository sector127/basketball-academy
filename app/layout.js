import {NextIntlClientProvider} from 'next-intl';
import {getLocale, getMessages} from 'next-intl/server';
import {Noto_Sans_Georgian, Inter} from "next/font/google";
import "./globals.css";
import {Toaster} from "@/components/ui/toaster";
import AuthSessionProvider from "@/providers/session-provider";
import {ThemeProvider} from "@/providers/theme-provider";

const inter = Inter({subsets: ["latin"]});
const notoSansGeorgian = Noto_Sans_Georgian({
    subsets: ['georgian'],
    weight: '400',
});

export const metadata = {
    title: "Brooklyn Basketball Academy - Tbilisi",
    description: "Brooklyn Basketball Academy's Tbilisi branch",
};

export default async function RootLayout({children}) {
    const locale = await getLocale();
    const messages = await getMessages();
    return (
        <html lang={locale} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
            <AuthSessionProvider>
                <body className={`${inter.className} ${notoSansGeorgian.className}`}>
                <ThemeProvider attribute="class"
                               defaultTheme="system"
                               enableSystem
                               disableTransitionOnChange>
                    {children}
                    <Toaster/>
                </ThemeProvider>
                </body>
            </AuthSessionProvider>
        </NextIntlClientProvider>
        </html>
    );
}
