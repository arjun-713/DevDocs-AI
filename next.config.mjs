/** @type {import('next').NextConfig} */
const nextConfig = {
    ...(process.env.DOCKER_BUILD === 'true' ? { output: 'standalone' } : {}),
    async rewrites() {
        const apiUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) return [];
        return [
            {
                source: '/api/docs',
                destination: `${apiUrl}/docs`,
            },
            {
                source: '/api/openapi.json',
                destination: `${apiUrl}/openapi.json`,
            },
            {
                source: '/api/:path*',
                destination: `${apiUrl}/api/:path*`,
            },
        ]
    },
}

export default nextConfig
