const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MinifyPlugin = require('babel-minify-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          }
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/templates/index.html'),
      filename: path.resolve(__dirname, 'dist/index.html'),
      minify: {
        collapseWhitespace: true
      },
      files: {
      //  css: ['style.css'],
       js: ['bundle.js'],
      }
    }),
    new MinifyPlugin(),
    new CompressionPlugin(),
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: 'jquery'
    })
  ]
};