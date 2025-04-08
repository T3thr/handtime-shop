/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: ['res.cloudinary.com'],
    },
    async headers() {
      return [
        {
          source: '/:all*(svg|jpg|jpeg|png|gif|bmp)',
          headers: [
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff', // This helps prevent content sniffing (misinterpreting the content).
            },
            {
              key: 'Cache-Control',
              value: 'private, no-store, no-cache, must-revalidate, proxy-revalidate', // Prevent caching of images
            },
          ],
        },
      ];
    },
    source: "/api/:path*",
    destination: "/api/:path*",
};

export default nextConfig;
