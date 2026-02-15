/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // pptxgenjs dynamically imports node:fs and node:https at runtime
      // (only on Node.js, not in browser). Webpack still tries to resolve
      // them when building the client bundle. Strip the node: prefix so
      // they hit the resolve.fallback (= false = empty module).
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        })
      );
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        https: false,
        http: false,
        stream: false,
        zlib: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
