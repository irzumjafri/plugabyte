// One-off: print each route to a PDF sized to its own full height, so the
// design is preserved instead of being chopped across A4 sheets.
import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;
const WIDTH = 1280;
const VIEW_H = Number(process.env.PB_VIEW_H ?? 1400);
const ORIGIN = process.argv[2] ?? 'http://localhost:3000';
const OUT = process.argv[3] ?? 'exports';
// PB_TARGETS overrides the site routes, as `url|name` pairs separated by commas.
// Used for one-offs that are not routes at all, e.g. the brand system HTML.
const ROUTES = process.env.PB_TARGETS
  ? process.env.PB_TARGETS.split(',').map(pair => {
      const [url, name] = pair.split('|');
      return [url, name];
    })
  : [
      ['/', 'plugabyte-home'],
      ['/work', 'plugabyte-work'],
      ['/rescue', 'plugabyte-rescue'],
      ['/about', 'plugabyte-about'],
    ];

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--window-size=${WIDTH},${VIEW_H}`,
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  '--user-data-dir=/tmp/pb-pdf-profile',
  '--allow-file-access-from-files',
  // The homepage hero is WebGL; without a software rasteriser it prints blank.
  '--enable-unsafe-swiftshader',
  '--use-angle=swiftshader',
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitForChrome() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return (await r.json()).webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('chrome did not start');
}

function client(url) {
  const ws = new WebSocket(url);
  let id = 0;
  const pending = new Map();
  const ready = new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      if (m.error) rej(new Error(JSON.stringify(m.error)));
      else res(m.result);
    }
  };
  return {
    ready,
    close: () => ws.close(),
    send(method, params = {}) {
      const mid = ++id;
      return new Promise((res, rej) => {
        pending.set(mid, { res, rej });
        ws.send(JSON.stringify({ id: mid, method, params, sessionId: undefined }));
      });
    },
  };
}

const browserWs = await waitForChrome();
const browser = client(browserWs);
await browser.ready;

await mkdir(OUT, { recursive: true });

for (const [route, name] of ROUTES) {
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const target = list.find(t => t.id === targetId);
  const page = client(target.webSocketDebuggerUrl);
  await page.ready;

  await page.send('Page.enable');
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: WIDTH, height: VIEW_H, deviceScaleFactor: 2, mobile: false,
  });
  await page.send('Page.navigate', { url: /^[a-z]+:/.test(route) ? route : ORIGIN + route });
  await sleep(5000); // fonts, WebGL first frame, next/image

  // Viewport units are the whole problem here. Both printToPDF and
  // captureBeyondViewport re-resolve vh/dvh against the output surface, so any
  // section sized that way swells to fill a tall sheet — which first pushed
  // every other section off the page, then duplicated the whole document.
  //
  // Freezing them by class name broke the moment the classes changed, so
  // instead: getComputedStyle has already resolved vh to px at the real
  // viewport, so write that pixel value back inline. No class coupling, and it
  // keeps each section's own height rather than pinning them all to one.
  //
  // Lazy images are the other half — below-the-fold art had not decoded when
  // the capture ran, so it came out blank.
  await page.send('Runtime.evaluate', {
    expression: `(async () => {
      const s = document.createElement('style');
      s.textContent = '@page{margin:0}html,body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}';
      document.head.appendChild(s);

      // Only min-height, and only where something actually set one: a vh value
      // may come from a stylesheet rather than an inline style, so match on the
      // resolved value instead of the declaration. Freezing height outright
      // would pin every auto-sized box on the page.
      for (const el of document.querySelectorAll('*')) {
        const mh = getComputedStyle(el).minHeight;
        if (mh && mh !== '0px' && mh !== 'auto' && mh.endsWith('px')) {
          el.style.minHeight = mh;
        }
      }

      const imgs = [...document.images];
      imgs.forEach(i => { i.loading = 'eager'; });
      await Promise.all(imgs.map(i => i.decode().catch(() => {})));
    })()`,
    awaitPromise: true,
  });
  await sleep(900);

  // Scroll the whole page once so anything lazy has been in the viewport.
  await page.send('Runtime.evaluate', {
    expression: `(async()=>{const h=document.body.scrollHeight;for(let y=0;y<h;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,90));}window.scrollTo(0,0);})()`,
    awaitPromise: true,
  });
  await sleep(1200);

  // Wait for the height to stop moving before measuring. Measuring too early
  // gave a taller figure than the settled page, and Chrome filled the surplus
  // by repeating the document from the top.
  let height = 0;
  for (let i = 0; i < 20; i++) {
    const { cssContentSize } = await page.send('Page.getLayoutMetrics');
    const h = Math.ceil(cssContentSize.height);
    if (h === height) break;
    height = h;
    await sleep(400);
  }

  // printToPDF keeps real, selectable, searchable text.
  const { data } = await page.send('Page.printToPDF', {
    printBackground: true,
    paperWidth: WIDTH / 96,
    paperHeight: height / 96,
    marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
    scale: 1,
  });
  const file = path.join(OUT, `${name}.pdf`);
  const buf = Buffer.from(data, 'base64');
  await writeFile(file, buf);
  console.log(`${file}  ${WIDTH}x${height}px  ${(buf.length / 1024 / 1024).toFixed(2)} MB`);

  page.close();
  await browser.send('Target.closeTarget', { targetId });
}

browser.close();
chrome.kill();

/*
 * Usage:  node scripts/export-pdfs.mjs [origin] [outDir]
 *   node scripts/export-pdfs.mjs http://localhost:3000 exports
 *
 * Needs the dev server (or any build) already running at `origin`.
 * Drives Chrome over the DevTools protocol rather than pulling in puppeteer.
 */
