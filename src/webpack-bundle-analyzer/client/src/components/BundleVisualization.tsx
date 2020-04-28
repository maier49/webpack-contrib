import global from '@dojo/framework/shim/global';
import { create, tsx } from '@dojo/framework/core/vdom';
import icache from '@dojo/framework/core/middleware/icache';
import { Sunburst } from './Sunburst';
import * as filesize from 'filesize';

import * as css from './BundleVisualization.m.css';
import NativeSelect from '@dojo/widgets/native-select';

const factory = create({ icache });

const bundleList = global.window.__bundleList;
const bundleContent = global.window.__bundleContent;

export const BundleVisualization = factory(function BundleVisualization({ middleware: { icache } }) {
	if (!bundleContent || !bundleList) {
		return null;
	}

	const singleBundle = bundleList.length <= 1;
	const item = icache.get<any>('item');
	const selectedBundle = icache.get('selected-bundle') || bundleList[0];
	const data = icache.get('chart-data') || bundleContent[selectedBundle];
	function onHover(item: any) {
		icache.set('item', item);
	}

	return (
		<div classes={[css.root]}>
			<div classes={[css.stats]}>
				{!singleBundle && (
					<NativeSelect
						onValue={(result: any) => {
							icache.set('selected-bundle', result);
							icache.set('chart-data', bundleContent[result]);
						}}
						initialValue={bundleList[0]}
						classes={{ '@dojo/widgets/select': { root: [css.selectOverride] } }}
						options={bundleList.map((bundle: string) => ({ value: bundle }))}
					/>
				)}
				{item && (
					<div classes={[css.infoInner]}>
						<div classes={[css.filename]}>
							{item.label.indexOf(selectedBundle) === -1 ? item.label : selectedBundle}
						</div>
						<div classes={[css.contents]}>
							<div classes={[css.size]}>{filesize(item.statSize)}</div>
							<div classes={[css.type]}>stat</div>
							<div classes={[css.size]}>{item.parsedSize && filesize(item.parsedSize)}</div>
							<div classes={[css.type]}>{item.parsedSize && 'parsed'}</div>
							<div classes={[css.size]}>{item.gzipSize && filesize(item.gzipSize)}</div>
							<div classes={[css.type]}>{item.gzipSize && 'gzip'}</div>
						</div>
					</div>
				)}
			</div>
			<div classes={[css.sunburst]}>
				{data && <Sunburst key={selectedBundle} chartData={data} onHover={onHover} />}
			</div>
		</div>
	);
});
