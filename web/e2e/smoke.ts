/**
 * Smoke test of the built daemon in Chromium: `make smoke`. The Vite dev
 * server, Vitest and Storybook never apply the page's Content-Security-Policy
 * or Trusted Types (internal/ui), so this is the check that the built UI runs
 * under them. It serves the binary on a free port, opens the page and a client
 * route, and fails on a policy violation, a console warning or error, an
 * uncaught exception, or a page that never shows the injected configuration
 * and the live event stream.
 *
 *   node e2e/smoke.ts <path to skeletond>
 */
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createInterface } from 'node:readline';
import { chromium, type Page } from 'playwright';

const TIMEOUT_MS = 15_000;

/** Reports each policy violation to the console, where the page's listener below collects it. */
const reportViolations = `document.addEventListener('securitypolicyviolation', e =>
  console.error('policy violation: ' + e.effectiveDirective + ' blocked ' + (e.blockedURI || 'inline')));`;

interface Daemon {
  url: string;
  logs: string[];
  stop: () => Promise<void>;
}

/** Starts skeletond on a free loopback port; its "serving" log line gives the address. */
async function serve(binary: string): Promise<Daemon> {
  const daemon = spawn(binary, ['-listen', '127.0.0.1:0', '-log-format', 'json'], {
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  const exited = once(daemon, 'exit');
  const logs: string[] = [];

  const url = await new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('skeletond did not start serving')), TIMEOUT_MS);
    daemon.once('error', reject);
    daemon.once('exit', code => reject(new Error(`skeletond exited with ${code}:\n${logs.join('\n')}`)));
    createInterface({ input: daemon.stderr }).on('line', line => {
      logs.push(line);
      const record = JSON.parse(line) as { msg?: string; addr?: string };
      if (record.msg === 'serving' && record.addr) {
        clearTimeout(timer);
        resolve(record.addr);
      }
    });
  });

  return {
    url,
    logs,
    stop: async () => {
      daemon.kill('SIGTERM');
      await exited;
    },
  };
}

/** Collects everything the page reports that a healthy page would not. */
function watch(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(`console ${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', error => problems.push(`uncaught: ${error.message}`));
  return problems;
}

async function check(url: string): Promise<string[]> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const problems = watch(page);
    await page.addInitScript(reportViolations);

    const home = await page.goto(url);
    const policy = home?.headers()['content-security-policy'] ?? '';
    if (!policy.includes("script-src 'self' 'sha256-") || !policy.includes('require-trusted-types-for')) {
      problems.push(`the page's Content-Security-Policy lacks the injected script's hash or Trusted Types: ${policy}`);
    }

    // The name comes from the injected configuration; "live" from the first stream event.
    const header = page.getByRole('banner');
    await header.getByText('skeleton', { exact: true }).waitFor({ timeout: TIMEOUT_MS });
    await header.getByText('live', { exact: true }).waitFor({ timeout: TIMEOUT_MS });
    await page.getByText('Last answer').waitFor({ timeout: TIMEOUT_MS });

    // A client route falls back to the page, and the router renders its not-found page.
    await page.goto(`${url}/no/such/page`);
    await page.getByRole('heading', { name: 'Not found' }).waitFor({ timeout: TIMEOUT_MS });

    return problems;
  } finally {
    await browser.close();
  }
}

const binary = process.argv[2];
if (!binary) throw new Error('usage: node e2e/smoke.ts <path to skeletond>');

const daemon = await serve(binary);
try {
  const problems = await check(daemon.url);
  if (problems.length > 0) {
    console.error(`smoke: ${problems.length} problem(s) at ${daemon.url}\n${problems.join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log(`smoke: the built UI renders and streams under its policies (${daemon.url})`);
  }
} catch (error) {
  console.error(`smoke: ${String(error)}\ndaemon log:\n${daemon.logs.join('\n')}`);
  process.exitCode = 1;
} finally {
  await daemon.stop();
}
