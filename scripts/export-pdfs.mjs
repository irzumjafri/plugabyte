// One-off: print each route to a PDF sized to its own full height, so the
// design is preserved instead of being chopped across A4 sheets.
import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;
const WIDTH = 1280;
const VIEW_H = 1400;
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

  // The landing is sized in dvh. Both printToPDF and captureBeyondViewport
  // re-resolve viewport units against the output surface, so a page sized from
  // the layout makes the hero swell to fill it — which shoved every other
  // section off the sheet, and on the second attempt repeated the whole page.
  // Pinning that one rule to pixels breaks the circularity for good.
  await page.send('Runtime.evaluate', {
    expression: `(()=>{const s=document.createElement('style');s.id='pb-export';
      s.textContent='@page{margin:0}html,body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}[class*="landing"]{min-height:${VIEW_H - 66}px!important}';
      document.head.appendChild(s);})()`,
  });
  await sleep(400);

  // Scroll the whole page once so anything lazy has been in the viewport.
  await page.send('Runtime.evaluate', {
    expression: `(async()=>{const h=document.body.scrollHeight;for(let y=0;y<h;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,90));}window.scrollTo(0,0);})()`,
    awaitPromise: true,
  });
  await sleep(1200);

  const { cssContentSize } = await page.send('Page.getLayoutMetrics');
  const height = Math.ceil(cssContentSize.height);

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
