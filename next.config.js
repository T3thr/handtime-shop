/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com', 'example.com'], // Add your domains
  },
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|bmp|mp4|webm)', // Include video types like mp4/webm
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Cache-Control',
            value: 'private, no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Content-Disposition',
            value: 'inline', // Forces content to be displayed inline rather than downloaded
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
