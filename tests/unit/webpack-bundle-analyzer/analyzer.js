const fs = require('fs');
const del = require('del');
const sinon = require('sinon');
const childProcess = require('child_process');
const chaiSubset = require('chai-subset');


let nightmare;
const chai = intern.getPlugin('chai');
chai.use(chaiSubset);
const { expect } = chai;
const { describe, it, before, after, beforeEach, afterEach } = intern.getInterface('bdd');

describe('Analyzer', function () {
  let clock;

  before(function () {
    const Nightmare = require('nightmare');
    nightmare = Nightmare();
    del.sync(`${__dirname}/output`);
    clock = sinon.useFakeTimers();
  });

  beforeEach(async function () {
    this.timeout = 15000;
    await nightmare.goto('about:blank');
  });

  afterEach(function () {
    del.sync(`${__dirname}/output`);
  });

  after(function () {
    clock.restore();
  });

  it('should support stats files with all the information in `children` array', async function () {
    generateReportFrom('with-children-array.json');
    await expectValidReport();
  });

  it('should support bundles with invalid dynamic require calls', async function () {
    generateReportFrom('with-invalid-dynamic-require.json');
    await expectValidReport({ statSize: 136 });
  });

  it('should use information about concatenated modules generated by webpack 4', async function () {
    generateReportFrom('with-module-concatenation-info/stats.json');
    const chartData = await getChartData();
    expect(chartData[0].groups[0]).to.containSubset(
      require('../../support/fixtures/webpack-bundle-analyzer/stats/with-module-concatenation-info/expected-chart-data')
    );
  });
});

function generateReportFrom(statsFilename) {
  childProcess.execSync(
    `node ../../../../release/webpack-bundle-analyzer/bin/analyzer.js -m static -r output/report.html -O ../../support/fixtures/webpack-bundle-analyzer/stats/${statsFilename}`,
    { cwd: __dirname }
  );
}

async function getChartData() {
  return await nightmare
    .goto(`file://${__dirname}/output/report.html`)
    .evaluate(() => window.chartData);
}

async function expectValidReport(opts) {
  const {
    bundleLabel = 'bundle.js',
    statSize = 141
  } = opts || {};

  expect(fs.existsSync(`${__dirname}/output/report.html`)).to.be.true;
  const chartData = await getChartData();
  expect(chartData[0]).to.containSubset({
    label: bundleLabel,
    statSize
  });
}
