/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingIncludes: {
      '/**': [
        './node_modules/pdfkit/js/standard-fonts/**/*',
        './node_modules/pdfkit/js/data/**/*',
      ],
    },
  },
};

export default nextConfig;
