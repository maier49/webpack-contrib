import * as path from 'path';
import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as mkdir from 'mkdirp';
import * as analyzer from './analyzer';
import { findLargestPackage } from './parseUtils';

const search = require('libnpmsearch');
export interface ReportDataOptions {
	reportFilename: string;
	bundleDir: string | null;
	excludeBundle: string;
}

export async function generateReportData(bundleStats: any, opts: Partial<ReportDataOptions> = {}) {
	const { reportFilename = 'report.html', bundleDir = null, excludeBundle } = opts;

	let excludeBundleRegex: RegExp;
	if (excludeBundle) {
		excludeBundleRegex = new RegExp(excludeBundle);
	}

	const chartData = analyzer.getViewerData(bundleStats, bundleDir);
	let reportFilePath = reportFilename;

	if (!path.isAbsolute(reportFilePath)) {
		reportFilePath = path.resolve(bundleDir || process.cwd(), reportFilePath);
	}
	mkdir.sync(path.dirname(reportFilePath));
	const bundlesList: string[] = [];
	const bundleContent = chartData.reduce((bundleContent: any, data: any) => {
		const bundleFilename = data && data.label && data.label.split('/').slice(-1)[0];
		if (excludeBundle && excludeBundleRegex.test(bundleFilename)) {
			return bundleContent;
		}
		bundlesList.push(bundleFilename);
		bundleContent[bundleFilename] = data;
		return bundleContent;
	}, {});
	const dependencies = await generatePackageData(chartData);

	const reporterFiles = glob.sync(path.join(__dirname, 'reporter', '**', '*.*'));
	let bundleContentFileName = 'bundleContent.js';
	let bundleListFileName = 'bundleList.js';
	let dependencyInfoFileName = 'packageInfo.js';
	reporterFiles.forEach((file) => {
		if (file.indexOf('bundleContent') > -1) {
			bundleContentFileName = path.parse(file).base;
		} else if (file.indexOf('bundleList') > -1) {
			bundleListFileName = path.parse(file).base;
		} else if (file.indexOf('packageInfo') > -1) {
			dependencyInfoFileName = path.parse(file).base;
		} else {
			fs.copySync(
				file,
				path.join(
					path.dirname(reportFilePath),
					'analyzer',
					path.relative(path.join(__dirname, 'reporter'), file)
				)
			);
		}
	});
	fs.writeFileSync(
		path.join(path.dirname(reportFilePath), 'analyzer', bundleListFileName),
		`window.__bundleContent = ${JSON.stringify(bundleContent)}`
	);
	fs.writeFileSync(
		path.join(path.dirname(reportFilePath), 'analyzer', bundleContentFileName),
		`window.__bundleList = ${JSON.stringify(bundlesList)}`
	);
	fs.writeFileSync(
		path.join(path.dirname(reportFilePath), 'analyzer', dependencyInfoFileName),
		`window.__packageInfo = ${JSON.stringify(dependencies)}`
	);

	return chartData.reduce(
		(chunkMap, bundleData: any) => {
			bundleData.chunks &&
				bundleData.chunks.forEach((chunk: string) => {
					chunkMap[chunk] = bundleData;
				});

			return chunkMap;
		},
		{} as { [index: string]: any }
	);
}

export async function generatePackageData(chartData: any[]) {
	const basePath = process.cwd();
	const packageJsonPath = path.join(basePath, 'package.json');
	const packageJson = fs.existsSync(packageJsonPath) ? require(packageJsonPath) : {};
	const packageDeps = packageJson.dependencies || {};
	const packageSizeData: { [dependencyName: string]: { size: number; name: string } } = {};
	chartData.forEach((data: any) => {
		findLargestPackage(data, packageSizeData);
	});

	return Promise.all(
		Object.keys(packageSizeData).map(async (key) => {
			const results = (await search(key)).filter(({ name }: { name: string }) => name === key);
			const [{ version: latest = 'Package not found' } = { version: 'Package not found' }] = results;

			return {
				...(packageSizeData[key] || {}),
				name: key,
				target: packageDeps[key],
				latest
			};
		})
	);
}
