var path = require('path');
var webpack = require('webpack');

require('babel-core/register')({
  presets: ['es2015', 'react']
});
require.extensions['.css'] = () => {
  return;
};

module.exports = {
    //debug: true,
    debug: false,
    //devtool: 'eval-source-map',
    entry: [
	//'webpack-dev-server/client?http://0.0.0.0:9000/',
	//'webpack/hot/only-dev-server',
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
	//new webpack.HotModuleReplacementPlugin(),
	new webpack.ProvidePlugin({
	    "$": "jquery",
	    "jQuery": "jquery",
	    "window.jQuery": "jquery"}),
	new webpack.DefinePlugin({
	    'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
	}),
	new webpack.optimize.UglifyJsPlugin()
    ],
    externals: {
	'react': 'React',
	'react-dom': 'ReactDOM',
	'redux': 'Redux',
	'react-redux': 'ReactRedux',
	"jquery" : "jQuery"
    }
};
