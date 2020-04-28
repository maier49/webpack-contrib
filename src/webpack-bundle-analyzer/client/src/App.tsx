import { create, tsx } from '@dojo/framework/core/vdom';
import icache from '@dojo/framework/core/middleware/icache';
import TwoColumnLayout from '@dojo/widgets/two-column-layout';

import Outlet from '@dojo/framework/routing/Outlet';
import { BundleVisualization } from './components/BundleVisualization';
import Link from '@dojo/framework/routing/Link';
import Header from '@dojo/widgets/header';
import theme from '@dojo/framework/core/middleware/theme';
import * as css from './App.m.css';
import Dependencies from './components/Dependencies';
const logo = require('./assets/logo.svg');

const factory = create({ icache, theme });

export const App = factory(function App({ middleware: { icache, theme } }) {
	const classes = theme.classes(css);
	return (
		<div classes={classes.root}>
			<Header>
				{{
					leading: <img classes={classes.logo} src={logo} />,
					title: 'Dojo Build Dashboard'
				}}
			</Header>
			<TwoColumnLayout
				bias="trailing"
				classes={{
					'@dojo/widgets/two-column-layout': {
						small: [classes.small]
					}
				}}
			>
				{{
					leading: (
						<div classes={classes.menu}>
							<ul classes={classes.list}>
								<li classes={classes.listElement}>
									<Link classes={classes.link} to="home">
										Home
									</Link>
								</li>
								<li classes={classes.listElement}>
									<Link classes={classes.link} to="visualization">
										Visualization
									</Link>
								</li>
								<li classes={classes.listElement}>
									<Link classes={classes.link} to="dependencies">
										Dependencies
									</Link>
								</li>
							</ul>
						</div>
					),
					trailing: (
						<div classes={classes.content}>
							<Outlet id="main">
								{{
									home: <div>This is the dojo dashboard</div>,
									visualization: <BundleVisualization />,
									dependencies: <Dependencies />
								}}
							</Outlet>
						</div>
					)
				}}
			</TwoColumnLayout>
		</div>
	);
});
