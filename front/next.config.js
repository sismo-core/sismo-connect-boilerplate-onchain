/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = { "utf-8-validate": false, bufferutil: false };
    config.experiments = {
      ...config.experiments,
    };
    config.ignoreWarnings = [
      { module: /src\/utils\/useContract.tsx/ },
      { module: /src\/utils\/index.ts/ },
      { module: /src\/app\/page.tsx/ },

      { module: /node_modules\/node-fetch\/lib\/index\.js/ },
      { module: /node_modules\/cross-fetch\/polyfill\.js/ },
      { module: /node_modules\/@walletconnect\/keyvaluestorage\/dist\/cjs\/node-js\/db.js/ },
      { module: /node_modules\/@walletconnect\/keyvaluestorage\/dist\/cjs\/node-js\/index.js/ },
      { module: /node_modules\/@walletconnect\/keyvaluestorage\/dist\/cjs\/index.js/ },
      { module: /node_modules\/@walletconnect\/core\/dist\/index.cjs.js/ },
      { module: /node_modules\/@walletconnect\/sign-client\/dist\/index.cjs.js/ },
      { module: /node_modules\/@walletconnect\/universal-provider\/dist\/index.es.js/ },
      { module: /node_modules\/@walletconnect\/ethereum-provider\/dist\/index.es.js/ },
      { module: /node_modules\/@wagmi\/connectors\/dist\/walletConnect.js/ },
      { module: /node_modules\/@wagmi\/core\/dist\/connectors\/walletConnect.js/ },
      { module: /node_modules\/wagmi\/dist\/connectors\/walletConnect.js/ },
      { module: /node_modules\/@rainbow-me\/rainbowkit\/dist\/index.js/ },
    ];
    return config;
  },
};

module.exports = nextConfig;
