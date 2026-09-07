/**
 * Mid-tier mobile performance probe.
 *
 *   npm run perf            # against the local preview build
 *   npm run perf -- <url>   # against a deployment
 *
 * Emulates a Moto-G-class device: 390x844, 4x CPU slowdown, slow-4G latency,
 * and no GPU — so the numbers here are a pessimistic bound, not a phone
 * reading. It reports the three things this app is actually judged on: how
 * long the first paint takes, how long an AudioContext takes to make its first
 * sound after a tap, and whether moving between screens drops frames.
 *
 * Requires a server already running (npm run preview).
 */
import puppeteer from 'puppeteer-core';

const CPU_SLOWDOWN = 4;
const RUNS = 5;
const URL = process.argv[2] || 'http://127.0.0.1:4173/';
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const b = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'],
});

const page = await b.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const client = await page.createCDPSession();
await client.send('Emulation.setCPUThrottlingRate', { rate: CPU_SLOWDOWN });
await client.send('Network.enable');
await client.send('Network.emulateNetworkConditions', {
  offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
});

await page.evaluateOnNewDocument(() => {
  localStorage.setItem('keyperfect_tutorial_completed', 'true');
  window.__longTasks = [];
  new PerformanceObserver(list => {
    for (const e of list.getEntries()) window.__longTasks.push({ start: e.startTime, dur: e.duration });
  }).observe({ entryTypes: ['longtask'] });
});

await page.goto(URL, { waitUntil: 'load' });
await new Promise(r => setTimeout(r, 1500));

const paint = await page.evaluate(() => Object.fromEntries(
  performance.getEntriesByType('paint').map(e => [e.name, Math.round(e.startTime)])));
console.log('--- cold load (4x CPU, slow 4G) ---');
console.log('  first-paint            ', paint['first-paint'] + ' ms');
console.log('  first-contentful-paint ', (paint['first-contentful-paint'] ?? 'NOT REPORTED') + ' ms');

// ---- Audio startup: time from tap to the first scheduled note ----
const audioTimes = [];
for (let i = 0; i < RUNS; i++) {
  const ms = await page.evaluate(async () => {
    const t0 = performance.now();
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    await ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.01);
    const elapsed = performance.now() - t0;
    await ctx.close();
    return elapsed;
  });
  audioTimes.push(ms);
}
const stat = a => ({
  min: Math.round(Math.min(...a)), med: Math.round(a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)]),
  max: Math.round(Math.max(...a)),
});
const at = stat(audioTimes);
console.log('\n--- AudioContext startup (cold context, per run) ---');
console.log(`  min ${at.min} ms | median ${at.med} ms | max ${at.max} ms   over ${RUNS} runs`);

// ---- Route transitions: long tasks and frame gaps per navigation ----
console.log('\n--- route transitions (tap -> screen settled) ---');
const tabs = (process.env.TAB_ORDER || 'Play,Learn,Tools,Stats,Home').split(',');
for (const tab of tabs) {
  const r = await page.evaluate(async name => {
    const before = window.__longTasks.length;
    const btn = [...document.querySelectorAll('nav button')].find(b => b.textContent.trim() === name);
    if (!btn) return null;

    const frames = [];
    let last = performance.now();
    let stop = false;
    const tick = () => {
      const now = performance.now();
      frames.push(now - last);
      last = now;
      if (!stop) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const t0 = performance.now();
    btn.click();
    await new Promise(res => setTimeout(res, 700));
    stop = true;

    const added = window.__longTasks.slice(before);
    const worst = frames.length ? Math.max(...frames) : 0;
    const dropped = frames.filter(f => f > 32).length; // >2 frames at 60Hz
    return {
      settleMs: Math.round(performance.now() - t0),
      longTasks: added.length,
      longestTaskMs: added.length ? Math.round(Math.max(...added.map(t => t.dur))) : 0,
      worstFrameMs: Math.round(worst),
      droppedFrames: dropped,
      totalFrames: frames.length,
    };
  }, tab);
  if (r) {
    console.log(`  ${tab.padEnd(6)} longTasks=${r.longTasks} longest=${r.longestTaskMs}ms  worstFrame=${r.worstFrameMs}ms  dropped=${r.droppedFrames}/${r.totalFrames}`);
  }
}

// ---- Opening the two heaviest modal tools ----
console.log('\n--- heavy screens ---');
for (const [label, open] of [['Song Analysis', '🎼 Song Analysis'], ['Custom Practice', '⚙️ Custom Practice']]) {
  await page.evaluate(() => [...document.querySelectorAll('nav button')].find(b => b.textContent.trim() === 'Tools')?.click());
  await new Promise(r => setTimeout(r, 400));
  const r = await page.evaluate(async text => {
    const before = window.__longTasks.length;
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes(text));
    if (!btn) return null;
    const t0 = performance.now();
    btn.click();
    await new Promise(res => setTimeout(res, 700));
    const added = window.__longTasks.slice(before);
    return { ms: Math.round(performance.now() - t0), longTasks: added.length,
             longest: added.length ? Math.round(Math.max(...added.map(t => t.dur))) : 0 };
  }, open.slice(2));
  if (r) console.log(`  ${label.padEnd(16)} longTasks=${r.longTasks} longest=${r.longest}ms`);
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 300));
}

await b.close();
