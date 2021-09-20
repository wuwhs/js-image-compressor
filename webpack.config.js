const TerserWebpackPlugin = require('terser-webpack-plugin')
const path = require('path')

module.exports = {
  mode: 'none',
  entry: {
    'image-compressor': './src/index.js',
    'image-compressor.min': './src/index.js',
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].js',
    library: 'ImageCompressor',
    libraryExport: 'default',
    libraryTarget: 'umd',
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserWebpackPlugin({
        include: /\.min\./,
      }),
    ],
  },
}
