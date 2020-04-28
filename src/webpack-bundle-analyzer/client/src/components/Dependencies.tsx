import global from '@dojo/framework/shim/global';
import { create, tsx } from '@dojo/framework/core/vdom';
import * as css from './Dependencies.m.css';
import theme from '@dojo/framework/core/middleware/theme';
import icache from '@dojo/framework/core/middleware/icache';
import Card from '@dojo/widgets/card';
import NativeSelect from '@dojo/widgets/native-select';

const packageInfo = global.window.__packageInfo;

const factory = create({ theme, icache }).properties();

export default factory(function Dependencies({ middleware: { theme, icache } }) {
	const type = icache.getOrSet<'Explicit' | 'All'>('type', 'Explicit');
	const classes = theme.classes(css);
	return (
		<div classes={classes.root}>
			<div classes={classes.select}>
				<NativeSelect
					onValue={(value) => {
						icache.set('type', value);
					}}
					initialValue="Explicit"
					options={[{ value: 'Explicit' }, { value: 'All' }]}
				/>
			</div>
			<ul classes={classes.list}>
				{packageInfo
					.filter((packageDetails: any) => type === 'All' || packageDetails.target)
					.map((packageDetails: any) => (
						<li classes={classes.listElement}>
							<Card>
								{{
									header: packageDetails.name,
									content: (
										<virtual>
											{packageDetails.target && (
												<div>Target version: {packageDetails.target}</div>
											)}
											<div>Latest version: {packageDetails.latest}</div>
											<div>
												{packageDetails.size
													? `Size in built code: ${packageDetails.size / 1000}kB`
													: 'Not found in output'}
											</div>
										</virtual>
									)
								}}
							</Card>
						</li>
					))}
			</ul>
		</div>
	);
});
