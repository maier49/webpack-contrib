const fs = require('fs');
const del = require('del');
const webpack = require('webpack');
const sinon = require('sinon');
const { expect } = intern.getPlugin('chai');
const BundleAnalyzerPlugin = require('../../../src/webpack-bundle-analyzer/BundleAnalyzerPlugin').default;
const { describe, it, before, after, beforeEach, afterEach } = intern.getInterface('bdd');


describe('Webpack config', function() {
	let clock;

	before(function() {
		del.sync(`${__dirname}/output`);
		clock = sinon.useFakeTimers();
	});

	beforeEach(async function() {
		this.timeout = 10000;
	});

	afterEach(function() {
		del.sync(`${__dirname}/output`);
	});

	after(function() {
		clock.restore();
	});

	it('with `multi` module should be supported', async function() {
		const config = makeWebpackConfig();

		config.entry.bundle = ['./src/a.js', './src/b.js'];

		await webpackCompile(config);
		clock.tick(1);

		const chartData = await getChartDataFromReport();
		expect(chartData[0].groups).to.containSubset([
			{
				label: 'multi ./src/a.js ./src/b.js',
				path: './multi ./src/a.js ./src/b.js',
				groups: undefined
			}
		]);
	});
});

async function getChartDataFromReport(reportFilename = 'report.html') {
	const contents = await new Promise((resolve, reject) => {
		fs.readFile(`${__dirname}/output/${reportFilename}`, 'utf8', (err, data) => {
			if (err) {
				reject(err);
			}

			resolve(data);
		});
	});


	return JSON.parse(/window.chartData = (.*);[\r\n]/.exec(contents)[1]);
}

function webpackCompile(config) {
	return new Promise((resolve, reject) => webpack(config, (err) => (err ? reject(err) : resolve())));
}

function makeWebpackConfig(opts) {
	opts = Object.assign({}, {
		analyzerOpts: {
			analyzerMode: 'static',
			openAnalyzer: false,
			logLevel: 'error'
		},
		minify: false,
		multipleChunks: false,
	}, opts);

	return {
		context: __dirname,
		entry: {
			bundle: '../../support/fixtures/webpack-bundle-analyzer/src'
		},
		output: {
			path: `${__dirname}/output`,
			filename: '[name].js'
		},
		plugins: ((plugins) => {
			plugins.push(new BundleAnalyzerPlugin(opts.analyzerOpts));

			if (opts.multipleChunks) {
				plugins.push(
					new webpack.optimize.CommonsChunkPlugin({
						name: 'manifest',
						minChunks: Infinity
					})
				);
			}

			if (opts.minify) {
				plugins.push(
					new webpack.optimize.UglifyJsPlugin({
						comments: false,
						mangle: true,
						compress: {
							warnings: false,
							negate_iife: false
						}
					})
				);
			}

			return plugins;
		})([])
	};
}
