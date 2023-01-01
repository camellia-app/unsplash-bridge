const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'src', 'worker.ts'),
  output: {
    filename: 'worker.js',
    path: path.resolve(__dirname, 'dist'),
    module: true,
    library: {
      type: 'module',
    },
  },
  devtool: 'source-map',
  mode: 'production',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  experiments: {
    outputModule: true,
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
