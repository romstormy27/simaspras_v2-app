/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    cpus: 1,
    workerThreads: false,
    outputFileTracingIncludes: {
      '/**': [
        './node_modules/pdfkit/js/standard-fonts/**/*',
        './node_modules/pdfkit/js/data/**/*',
      ],
    },
  },
};

export default nextConfig;
