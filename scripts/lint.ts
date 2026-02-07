// scripts/lint.ts

import { execFileSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';

import chalk from 'chalk';

interface CliConfig {
  fix: boolean;
  noCache: boolean;
  debug: boolean;
}

interface Check {
  file: string;
  args: string[];
  label: string;
  success: string;
  fail: string;
}

type ExecLikeError = Error & {
  status?: number;
  signal?: NodeJS.Signals | null;
  stderr?: unknown;
};

function isExecLikeError(err: unknown): err is ExecLikeError {
  return (
    err instanceof Error &&
    (Object.hasOwn(err, 'status') || Object.hasOwn(err, 'stderr') || Object.hasOwn(err, 'signal'))
  );
}

function parseArgs(argv: string[] = process.argv.slice(2)): CliConfig {
  const args = new Set(argv);
  return {
    fix: args.has('--fix'),
    noCache: args.has('--no-cache'),
    debug: args.has('--debug') || process.env.DEBUG === '1' || process.env.DEBUG === 'true',
  };
}

// ✅ Most reliable cross-platform way: when run under pnpm scripts, run pnpm via Node + pnpm JS entry.
// Avoids spawning pnpm.cmd directly (which can throw EINVAL on Windows setups).
function getPnpmRunner(): { file: string; prefixArgs: string[] } {
  const node = process.env.npm_node_execpath;
  const pnpmJs = process.env.npm_execpath;

  if (node && pnpmJs) {
    return { file: node, prefixArgs: [pnpmJs] };
  }

  // Fallback if invoked outside pnpm (less common in your setup)
  return { file: process.platform === 'win32' ? 'pnpm.exe' : 'pnpm', prefixArgs: [] };
}

function formatDuration(ms: number) {
  return ms < 1000 ? `${ms.toFixed(0)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function logExecError(err: unknown, debug: boolean): number {
  if (!isExecLikeError(err)) {
    console.error(chalk.red('Error message:'), String(err));
    return 1;
  }

  console.error(chalk.red('Error message:'), err.message);

  if (typeof err.status === 'number') {
    console.error(chalk.red('Exit code:'), err.status);
  }
  if (err.signal) {
    console.error(chalk.red('Signal:'), err.signal);
  }

  if (debug && err.stack) {
    console.error(chalk.gray('\nStack trace:\n'), err.stack);
  }

  return err.status ?? 1;
}

function runCheck(check: Check, debug: boolean): number {
  console.log('\n🔍 ' + chalk.gray(`${check.label} in progress…`));
  const start = performance.now();

  try {
    execFileSync(check.file, check.args, { stdio: 'inherit' });

    const duration = performance.now() - start;
    console.log(chalk.gray(`⏱️  ${formatDuration(duration)}`));
    console.log('✅ ' + chalk.greenBright(check.success));
    return 0;
  } catch (err: unknown) {
    const duration = performance.now() - start;
    console.log(chalk.gray(`⏱️  ${formatDuration(duration)}`));
    console.error('❌ ' + chalk.redBright(check.fail));
    return logExecError(err, debug);
  }
}

const config = parseArgs();
const pnpm = getPnpmRunner();

const checks: Check[] = [
  {
    file: pnpm.file,
    args: [
      ...pnpm.prefixArgs,
      'exec',
      'eslint',
      '.',
      ...(config.fix ? ['--fix'] : []),
      ...(config.noCache ? ['--no-cache'] : []),
    ],
    label: config.fix ? 'Fixing linting issues' : 'Linting',
    success: config.fix ? 'Linting issues fixed.' : 'Linting passed. Your code is clean and mean!',
    fail: config.fix ? 'Fixing linting issues failed' : 'Linting failed. Fix issues before committing.',
  },
  {
    file: pnpm.file,
    args: [...pnpm.prefixArgs, 'exec', 'tsc', '--noEmit'],
    label: 'Type-checking',
    success: 'Type-checking passed. Your types are solid.',
    fail: 'Type-checking failed. Fix type errors before proceeding.',
  },
];

let exitCode = 0;
for (const check of checks) {
  exitCode = runCheck(check, config.debug);
  if (exitCode !== 0) break;
}

process.exit(exitCode);
