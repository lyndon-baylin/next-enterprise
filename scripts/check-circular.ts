// scripts/check-circular.ts
import chalk from 'chalk';
import madge from 'madge';

type MadgeConfig = Parameters<typeof madge>[1];

(async () => {
  const config: MadgeConfig = {
    tsConfig: './tsconfig.json',
    fileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  };

  const originalWarn = console.warn;
  console.warn = ((msg?: unknown, ...args: unknown[]): void => {
    if (typeof msg === 'string' && (msg.includes('tailwindcss') || msg.includes('tw-animate-css'))) {
      return;
    }
    originalWarn(msg, ...args);
  }) as typeof console.warn;

  const res = await madge('./src', config);
  const circular = res.circular();

  if (circular.length > 0) {
    console.log(`\n⚠️  Found ${String(circular.length)} circular dependenc${circular.length > 1 ? 'ies' : 'y'}:`);
    circular.forEach((cycle) => {
      console.log('  -', cycle.join(' → '));
    });
    process.exitCode = 1; // fail build intentionally if circulars exist
  } else {
    console.log('✅ ' + chalk.greenBright('No circular dependencies found.'));
  }
})().catch((err) => {
  console.error('❌ ' + chalk.redBright('Madge analysis failed:'), err);
  process.exit(1);
});
