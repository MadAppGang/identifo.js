const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

// TODO: replace package name nikita-ks with @maddappgang

module.exports = {
  target: "web",
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "lib/identifo-js.js",
    library: "IdentifoJs",
    libraryTarget: "umd",
    globalObject: "this",
    umdNamedDefine: true,
  },
  watchOptions: {
    aggregateTimeout: 600,
    ignored: /node_modules/,
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
      cleanOnceBeforeBuildPatterns: [path.resolve(__dirname, "./dist")],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
};