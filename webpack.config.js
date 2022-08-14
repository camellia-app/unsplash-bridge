const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'src', 'worker.ts'),
  target: 'webworker',
  output: {
    filename: 'worker.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: 'source-map',
  mode: 'production',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
          compilerOptions: {
            inlineSources: true,
            sourceMap: true,
            sourceRoot: '/',
          },
        },
      },
    ],
  },
};
