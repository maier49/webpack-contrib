const deepcopy = require('deepcopy');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
const MultiEntryPlugin = require('webpack/lib/MultiEntryPlugin');
const ExternalsPlugin = require('webpack/lib/ExternalsPlugin');
const JsonpTemplatePlugin = require('webpack/lib/web/JsonpTemplatePlugin');
const SplitChunksPlugin = require('webpack/lib/optimize/SplitChunksPlugin');
const RuntimeChunkPlugin = require('webpack/lib/optimize/RuntimeChunkPlugin');
const LibraryTemplatePlugin = require('webpack/lib/LibraryTemplatePlugin');

const PLUGIN_NAME = 'AdditionalCompilationPlugin';
const FILENAME = '[name].es6.js';
const CHUNK_FILENAME = '[id].es6.js';

/**
 * Returns a ref to matching loader configs
 */
const getLoaders = (config: any, loaderName: string) => {
	let loaderConfig: any[] = [];
	config.module.rules.forEach((rule: any) => {
		if (rule.use && Array.isArray(rule.use)) {
			rule.use.forEach((rule: any) => {
				if (rule.loader && rule.loader === loaderName) {
					loaderConfig.push(rule);
				}
			});
		} else if (
			(rule.use && rule.use.loader && rule.use.loader === loaderName) ||
			(rule.loader && rule.loader === loaderName)
		) {
			loaderConfig.push(rule.use || rule);
		}
	});
	if (!loaderConfig.length) {
		throw new Error(`${loaderName} loader config not found!!!`);
	} else {
		return loaderConfig;
	}
};

const changeRule = (config: any, matcher: (rule: any) => boolean, use: any) => {
	config.module.rules.forEach((rule: any) => {
		if (matcher(rule) && Array.isArray(rule.use)) {
			rule.use = use;
		}
	});
};

export interface AdditionalCompilationPluginOptions {
	filename?: string;
	chunkFilename?: string;
	excludedPlugins?: string[];
	additionalPlugins?: any[];
	loaderOptions?: { name: string; optionCallback(options: any): any }[];
	ruleOptions?: { matcher(rule: any): boolean; use: any }[];
}

export default class AdditionalCompilationPlugin {
	public options: Required<AdditionalCompilationPluginOptions>;

	constructor(options: AdditionalCompilationPluginOptions) {
		this.options = Object.assign(
			{
				filename: FILENAME,
				chunkFilename: CHUNK_FILENAME,
				excludedPlugins: [PLUGIN_NAME],
				additionalPlugins: [],
				loaderOptions: [],
				ruleOptions: []
			},
			options
		);
	}

	apply(compiler: any) {
		compiler.hooks.make.tapAsync(PLUGIN_NAME, async (compilation: any, callback: any) => {
			const outputOptions = deepcopy(compiler.options);
			outputOptions.output.filename = this.options.filename;
			outputOptions.output.chunkFilename = this.options.chunkFilename;
			let plugins = (compiler.options.plugins || []).filter(
				(c: any) => this.options.excludedPlugins.indexOf(c.constructor.name) < 0
			);

			// Add the additionalPlugins
			plugins = plugins.concat(this.options.additionalPlugins);

			/**
			 * We are deliberately not passing plugins in createChildCompiler.
			 * All webpack does with plugins is to call `apply` method on them
			 * with the childCompiler.
			 * But by then we haven't given childCompiler a fileSystem or other options
			 * which a few plugins might expect while execution the apply method.
			 * We do call the `apply` method of all plugins by ourselves later in the code
			 */
			const childCompiler = compilation.createChildCompiler(PLUGIN_NAME, outputOptions.output);
			childCompiler.context = compiler.context;
			childCompiler.inputFileSystem = compiler.inputFileSystem;
			childCompiler.outputFileSystem = compiler.outputFileSystem;

			// Call the `apply` method of all plugins by ourselves.
			if (Array.isArray(plugins)) {
				for (const plugin of plugins) {
					plugin.apply(childCompiler);
				}
			}

			// All plugin work is done, call the lifecycle hook.
			childCompiler.hooks.afterPlugins.call(childCompiler);

			let entries = compiler.options.entry;
			if (typeof entries === 'function') {
				entries = await entries();
			}
			if (typeof entries === 'string') {
				entries = {
					index: entries
				};
			}

			Object.keys(entries).forEach((entry) => {
				const entryFiles = entries[entry];
				if (Array.isArray(entryFiles)) {
					new MultiEntryPlugin(compiler.context, entryFiles, entry).apply(childCompiler);
				} else {
					new SingleEntryPlugin(compiler.context, entryFiles, entry).apply(childCompiler);
				}
			});

			// Convert entry chunk to entry file
			new JsonpTemplatePlugin().apply(childCompiler);

			if (compiler.options.optimization) {
				if (compiler.options.optimization.splitChunks) {
					new SplitChunksPlugin(Object.assign({}, compiler.options.optimization.splitChunks)).apply(
						childCompiler
					);
				}
				if (compiler.options.optimization.runtimeChunk) {
					new RuntimeChunkPlugin(Object.assign({}, compiler.options.optimization.runtimeChunk)).apply(
						childCompiler
					);
				}
			}

			if (compiler.options.output.library || compiler.options.output.libraryTarget !== 'var') {
				new LibraryTemplatePlugin(
					compiler.options.output.library,
					compiler.options.output.libraryTarget,
					compiler.options.output.umdNamedDefine,
					compiler.options.output.auxiliaryComment || '',
					compiler.options.output.libraryExport
				).apply(childCompiler);
			}
			if (compiler.options.externals) {
				new ExternalsPlugin(compiler.options.output.libraryTarget, compiler.options.externals).apply(
					childCompiler
				);
			}

			compilation.hooks.additionalAssets.tapAsync(PLUGIN_NAME, (childProcessDone: any) => {
				this.options.ruleOptions.forEach(({ matcher, use }) => {
					changeRule(childCompiler.options, matcher, use);
				});

				this.options.loaderOptions.forEach(({ name, optionCallback }) => {
					const loaders = getLoaders(childCompiler.options, name);
					loaders.forEach((loader: any) => {
						loader.options = optionCallback(loader.options);
					});
				});

				childCompiler.hooks.make.tapAsync(PLUGIN_NAME, (childCompilation: any, callback: any) => {
					childCompilation.hooks.afterHash.tap(PLUGIN_NAME, () => {
						childCompilation.hash = compilation.hash;
						childCompilation.fullHash = compilation.fullHash;
					});
					callback();
				});

				childCompiler.runAsChild((err: any, entries: any, childCompilation: any) => {
					if (err) {
						return childProcessDone(err);
					}

					if (childCompilation.errors.length > 0) {
						return childProcessDone(childCompilation.errors[0]);
					}
					compilation.hooks.afterOptimizeAssets.tap(PLUGIN_NAME, () => {
						compilation.assets = Object.assign(childCompilation.assets, compilation.assets);

						compilation.namedChunkGroups = Object.assign(
							childCompilation.namedChunkGroups,
							compilation.namedChunkGroups
						);

						const childChunkFileMap = childCompilation.chunks.reduce((chunkMap: any, chunk: any) => {
							chunkMap[chunk.name] = chunk.files;
							return chunkMap;
						}, {});

						compilation.chunks.forEach((chunk: any) => {
							const childChunkFiles = childChunkFileMap[chunk.name];

							if (childChunkFiles) {
								chunk.files.push(...childChunkFiles.filter((v: any) => !chunk.files.includes(v)));
							}
						});
					});

					childProcessDone();
				});
			});
			callback();
		});
	}
}
