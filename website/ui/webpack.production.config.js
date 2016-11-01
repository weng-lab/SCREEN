var path = require('path');
var webpack = require('webpack');

require('babel-core/register')({
  presets: ['es2015', 'react']
});
require.extensions['.css'] = () => {
  return;
};

module.exports = {
    debug: false,
    entry: [
	'./src/index'
    ],
    module: {
	loaders: [
	    {
		test: /\.jsx?$/,
		exclude: /node_modules/,
		loader: 'babel',
		include: path.join(__dirname, 'src')
	    }
	]
    },
    resolve: {
	extensions: ['', '.js', '.jsx', '.css']
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
	new webpack.optimize.DedupePlugin(),
	new webpack.optimize.UglifyJsPlugin(),
	new webpack.optimize.AggressiveMergingPlugin(),
	new webpack.ProvidePlugin({
	    "$": "jquery",
	    "jQuery": "jquery",
	    "window.jQuery": "jquery"}),
	new webpack.DefinePlugin({
	    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
	})
    ]
};
