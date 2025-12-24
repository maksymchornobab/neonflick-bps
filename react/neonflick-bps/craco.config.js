const webpack = require("webpack");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,

        // ✅ браузерні polyfills
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer/"),
        process: require.resolve("process/browser.js"),
        path: require.resolve("path-browserify"),
        vm: require.resolve("vm-browserify"),
        util: require.resolve("util/"),
        assert: require.resolve("assert/"),
        url: require.resolve("url/"),
        zlib: require.resolve("browserify-zlib"),
        os: require.resolve("os-browserify/browser"),
        constants: require.resolve("constants-browserify"),
        querystring: require.resolve("querystring-es3"),

        // ❌ Node-only модулі
        fs: false,
        child_process: false,
        worker_threads: false,
        module: false,
        tty: false,
        http: false,
        https: false,
      };

      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser.js",
        })
      );

      return webpackConfig;
    },
  },
};
