const gulp = require('gulp');
const lighthouse = require('lighthouse');
const chromeLaumcher = require('chrome-launcher');
const printer = require('lighthouse/lighthouse-cli/printer');
const Reporter = require('lighthouse/lighthouse-core/report/report-generator');
const fs = require('fs-extra');
const del = require('del');
const urls = require('./urlList');
const path = require('path');

const desktopConfig = require('./config/lighthouse-desktop-config');
const mobileConfig = require('./config/lighthouse-mobile-config');

let chrome

/**
 * launchChrome.
 * @return {JSON} like {
 *  port: string,
 *  chromeFlags: string[],
 *  logLevel: string,
 * }
 */
async function launchChrome () {
    console.log('123')
    try {
        chrome = await chromeLaumcher.launch({
            chromeFlags: [
                "--disable-gpu",
                "--no-sandbox",
                "--headless"
            ],
            enableExtensions: true,
            logLevel: "error"
        });
        return {
            port: chrome.port,
            chromeFlags: [
                "--headless"
            ],
            logLevel: "error"
        }
    } catch (error) {
        console.log("lightHouse error:", error)
    }
}

/**
 * lighthouseRunnner.
 * @param {string=} url The URL to test. Optional if running in auditMode.
 * @param {LH.Flags=} opt Optional settings for the Lighthouse run. If present,
 *   they will override any settings in the config.
 * @param {LH.Config.Json=} config Configuration for the Lighthouse run. If
 *   not present, the default config is used.
 * @return {Promise<LH.RunnerResult|undefined>}
 */
async function lighthouseRunnner (url, opt, config = { extends: 'lighthouse:default' }) {
    try {
        return lighthouse(url, opt, config);
    } catch (error) {
        console.error('lighthouse error, runnning lighthouse', error);
    }
}

/**
 * genReport.
 * @param {string=} result The URL to test. Optional if running in auditMode.
 * @return {string|string[]}
 */
function genReport (result) {
    return Reporter.generateReport(result.lhr, 'html');
}

/**
 * lighthouseRunnner.
 * @param {string=} url The URL to test. Optional if running in auditMode.
 * @param {LH.Flags=} timestamp current time. Use Date.Now();
 * @param {LH.Config.Json=} config Configuration for the Lighthouse run. If
 *   not present, the default config is used.
 * @return {LH.config.Jsons || null}
 */
async function run (url, timestamp, config) {
    try {
        const chromeOpt = await launchChrome();
        const result = await lighthouseRunnner(url, chromeOpt, config);
        const report = genReport(result);
        await printer.write(report, 'html', `./cases/lighthouse-report@${timestamp}.html`);
        result.lhr.audits['first-contentful-paint'].rawValue;
        let res = {
            audits: {
                "first-contentful-paint": result.lhr.audits['first-contentful-paint']
            },
            categories: result.lhr.categories,
            lighthouseVersion: result.lhr.lighthouseVersion,
            requestedUrl: result.lhr.requestedUrl
        }

        return res;
    } catch (error) {
        console.error('test run error:', error);
        return;
    }
}

/**
 * write.
 * @param {string=} file The file path;
 * @param {string=} report the html file string;
 * @return {boolean} only use checked;
 */

async function write (file, report) {
    try {
        await fs.outputFile(file, report);
        return true
    } catch (e) {
        console.log("error while writing report ", e);
    }
}

// task Function
async function testTask (config) {
    const timestamp = Date.now();
    let spent = [];
    console.log(`共${urls.length}个任务`);
    for (let i = 0; i < urls.length; i++) {
        console.log(`当前第 ${i + 1} 个任务`)
        spent.push(await run(urls[i], timestamp, config));
    }
    let template = await fs.readFileSync('./summary/template/template.html', 'utf-8');
    let summary = Reporter.replaceStrings(template, [{
        search: '%%TIME_SPENT%%',
        replacement: JSON.stringify(spent)
    }, {
        search: '%%TIME_STAMP%%',
        replacement: timestamp
    }]);

    const filePath = path.resolve(__dirname, `./summary/report/summary@${timestamp}.html`);
    await write(filePath, summary);
    await chromeLaumcher.launch({
        chromeFlags: [
            "--disable-gpu",
        ],
        startingUrl: filePath,
        enableExtensions: true,
        logLevel: "error"
    });
}


gulp.task("clean:report", (cb) => {
    del([
        'cases/**/*',
        'summary/report/**/*'
    ], cb);
    cb();
})

gulp.task("start:desktop", async (cb) => {
    await testTask(desktopConfig);
    cb();
});

gulp.task("start:mobile", async (cb) => {
    await testTask(mobileConfig);
    cb();
});
