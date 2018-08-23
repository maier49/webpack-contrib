const fs = require('fs');
const { exec } = require('child_process');

const del = require('del');

const ROOT = `${__dirname}/../../support/fixtures/webpack-bundle-analyzer/dev-server`;
const WEBPACK_CONFIG_PATH = `${ROOT}/webpack.config.js`;
const webpackConfig = require(WEBPACK_CONFIG_PATH);
const { describe, it, before, afterEach } = intern.getInterface('bdd');

describe('Webpack Dev Server', function() {
	// before(deleteOutputDirectory);
	// afterEach(deleteOutputDirectory);
	//
	// it('should save report file to the output directory', function (done) {
	//   const timeout = 15000;
	//   const startedAt = Date.now();
	//
	//   const devServer = exec(`../../../../../node_modules/.bin/webpack-dev-server --config ${WEBPACK_CONFIG_PATH}`, {
	//     cwd: `${ROOT}/tmp`
	//   });
	//
	//   const reportCheckIntervalId = setInterval(() => {
	//     if (fs.existsSync(`${webpackConfig.output.path}/report.html`)) {
	//       finish();
	//     } else if (Date.now() - startedAt > timeout - 1000) {
	//       finish(`report file wasn't found in "${webpackConfig.output.path}" directory`);
	//     }
	//   }, 300);
	//
	//   function finish(errorMessage) {
	//     clearInterval(reportCheckIntervalId);
	//     devServer.kill();
	//     done(errorMessage ? new Error(errorMessage) : null);
	//   }
	// });
});

function deleteOutputDirectory() {
	del.sync(webpackConfig.output.path);
}
