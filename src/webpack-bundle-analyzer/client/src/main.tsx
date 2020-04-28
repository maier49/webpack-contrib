import renderer, { tsx } from '@dojo/framework/core/vdom';
import { App } from './App';
import Registry from '@dojo/framework/core/Registry';
import { registerRouterInjector } from '@dojo/framework/routing/RouterInjector';
import routes from './routes';
import { registerThemeInjector } from '@dojo/framework/core/mixins/Themed';
import dojo from '@dojo/widgets/theme/dojo';

const registry = new Registry();
registerThemeInjector(dojo, registry);
registerRouterInjector(routes, registry);
const r = renderer(() => <App />);
r.mount({ registry, domNode: document.getElementById('app')! });
