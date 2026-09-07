/**
 * Lighthouse runner.
 *
 *   npm run lighthouse                          # desktop, local preview
 *   npm run lighthouse -- <url> mobile <out>    # mid-tier mobile profile
 *
 * Uses the Chromium that ships with the dev container. Mobile runs apply a 4x
 * CPU slowdown and slow-4G throttling rather than Lighthouse's defaults, to
 * match the device class the QA report asked about.
 *
 * Requires a server already running (npm run preview).
 */
import puppeteer from 'puppeteer-core';
import lighthouse from 'lighthouse';
import { writeFile } from 'node:fs/promises';

const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const url = process.argv[2] || 'http://127.0.0.1:4173/';
const formFactor = process.argv[3] === 'mobile' ? 'mobile' : 'desktop';
const out = process.argv[4] || 'lighthouse-report.json';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();

const settings = {
  formFactor,
  screenEmulation: formFactor === 'mobile'
    ? { mobile: true, width: 390, height: 844, deviceScaleFactor: 3, disabled: false }
    : { mobile: false, width: 1280, height: 800, deviceScaleFactor: 1, disabled: false },
  // Mid-tier mobile: Moto-G-class CPU on a slow 4G link — the profile the
  // report asked to be measured on.
  throttling: formFactor === 'mobile'
    ? { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4,
        requestLatencyMs: 562.5, downloadThroughputKbps: 1474.5, uploadThroughputKbps: 675 }
    : { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0 },
  emulatedUserAgent: false,
};

const result = await lighthouse(url, { output: 'json', logLevel: 'error' }, { extends: 'lighthouse:default', settings }, page);
await writeFile(out, result.report);

const lhr = result.lhr;
if (lhr.runtimeError) console.log('RUNTIME ERROR:', lhr.runtimeError.code, lhr.runtimeError.message);
console.log(`\n=== ${formFactor.toUpperCase()} — ${url}`);
console.log(Object.entries(lhr.categories).map(([k, v]) => `${k}=${v.score === null ? 'n/a' : Math.round(v.score * 100)}`).join('  '));
for (const k of ['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift','speed-index','interactive','max-potential-fid','mainthread-work-breakdown','bootup-time']) {
  if (lhr.audits[k]?.displayValue) console.log('  ', k.padEnd(28), lhr.audits[k].displayValue);
}
const opps = Object.values(lhr.audits)
  .filter(a => (a.details?.type === 'opportunity' || a.details?.type === 'table') && a.score !== null && a.score < 0.9 && a.numericValue > 0)
  .sort((a, b) => (b.numericValue || 0) - (a.numericValue || 0))
  .slice(0, 10);
if (opps.length) {
  console.log('  -- flagged --');
  for (const o of opps) console.log('  ', o.id.padEnd(34), o.displayValue || '');
}
await browser.close();
