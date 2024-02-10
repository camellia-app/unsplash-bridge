const path = require('path');

module.exports = {
  devtool: 'source-map',
  entry: path.resolve(__dirname, 'src', 'worker.ts'),
  experiments: {
    outputModule: true,
  },
  mode: 'production',
  module: {
    rules: [
      {
        loader: 'ts-loader',
        options: {
          compilerOptions: {
            inlineSources: true,
            sourceMap: true,
            sourceRoot: '/',
          },
          transpileOnly: true,
        },
        test: /\.ts$/,
      },
    ],
  },
  output: {
    filename: 'worker.js',
    library: {
      type: 'module',
    },
    module: true,
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
};
