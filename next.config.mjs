import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin()
/** @type {import('next').NextConfig} */

const nextConfig = {
    reactStrictMode: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    outputFileTracingExcludes: {
        '*': [
            'tar',
            'gauge',
            'are-we-there-yet',
            'rimraf',
            '@mapbox/node-pre-gyp',
        ],
    },
};

export default withNextIntl(nextConfig);
