var path = require('path');
var webpack = require('webpack');

module.exports = {
    debug: true,
    devtool: 'cheap-module-eval-source-map',
  entry: [
    'webpack-dev-server/client?http://0.0.0.0:8081/',
    'webpack/hot/only-dev-server',
    './src/index'
  ],
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
	loader: 'react-hot!babel',
	include: path.join(__dirname, 'src')
    }]
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/',
    filename: 'bundle.js'
  },
  devServer: {
      contentBase: './dist',
      hot: true
  },
    plugins: [
    new webpack.HotModuleReplacementPlugin()
  ]
};
