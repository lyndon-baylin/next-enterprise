// scripts/lint.ts
import chalk from 'chalk';

import { execSync } from 'node:child_process';

/**
 * Enhanced type definition for execSync errors
 * Extends the standard Error interface with exec-specific properties
 */
interface ExecSyncError extends Error {
  status?: number; // Exit code from the command
  signal?: NodeJS.Signals | null; // Signal that terminated the process (e.g., SIGTERM)
  stderr?: Buffer; // Standard error output as a buffer
  stdout?: Buffer; // Standard output as a buffer
}

/**
 * Type guard to safely check if an unknown error is an ExecSyncError
 * This allows TypeScript to narrow the type and access specific properties
 */
function isExecSyncError(err: unknown): err is ExecSyncError {
  return err instanceof Error && ('status' in err || 'stderr' in err || 'stdout' in err);
}

/**
 * Parse command-line arguments into a configuration object
 * Supports flags like --fix, --no-cache, --debug
 * Works cross-platform (Windows, Mac, Linux)
 */
function parseArgs() {
  const args = new Set(process.argv.slice(2)); // Remove 'node' and script path

  return {
    fix: args.has('--fix'),
    noCache: args.has('--no-cache'),
    debug: args.has('--debug') || !!process.env.DEBUG,
  };
}

function logIfNumber(label: string, value?: number) {
  if (typeof value === 'number') {
    console.error(chalk.red(label), value);
  }
}

function logIfPresent(label: string, value?: string | null) {
  if (value) {
    console.error(chalk.red(label), value);
  }
}

function logStderr(stderr?: Buffer | string) {
  if (!stderr) {
    return;
  }
  console.error(chalk.red('stderr:\n'), stderr.toString().trim());
}

function handleRunCheckError(err: unknown, debug: boolean): never {
  if (!isExecSyncError(err)) {
    console.error(chalk.red('Error message:'), String(err));
    process.exit(1);
  }

  console.error(chalk.red('Error message:'), err.message);

  logIfNumber('Exit code:', err.status);
  logIfPresent('Signal:', err.signal);
  logStderr(err.stderr);

  if (debug && err.stack) {
    console.error(chalk.gray('\nStack trace:\n'), err.stack);
  }

  process.exit(err.status ?? 1);
}

/**
 * Runs a CLI command and logs success/failure with timing and detailed error info.
 * @param command - The shell command to execute
 * @param label - Human-readable label for logging
 * @param successMsg - Message to display on success
 * @param failMsg - Message to display on failure
 * @param debug - Whether to show full stack traces
 */
function runCheck(command: string, label: string, successMsg: string, failMsg: string, debug: boolean) {
  console.log('\n🔍 ' + chalk.gray(`${label} in progress…`));
  const timerLabel = `⏱️ ${label} duration`;
  console.time(timerLabel);

  try {
    // Execute the command and inherit stdio so output appears in real-time
    execSync(command, { stdio: 'inherit' });

    console.timeEnd(timerLabel);
    console.log('✅ ' + chalk.greenBright(successMsg));
  } catch (err: unknown) {
    console.timeEnd(timerLabel);

    console.error('❌ ' + chalk.redBright(failMsg));
    handleRunCheckError(err, debug);
  }
}

// Parse command-line arguments (works on all platforms!)
const config = parseArgs();

/**
 * List of checks to run sequentially
 * Each check will stop execution on failure (fail-fast behavior)
 */
const checks = [
  {
    // Let eslint.config.js define file patterns; add flags based on CLI args
    command: `eslint .${config.fix ? ' --fix' : ''}${config.noCache ? ' --no-cache' : ''}`,
    label: 'Linting',
    success: 'Linting passed. Your code is clean and mean!',
    fail: 'Linting failed. Fix issues before committing.',
  },
  {
    command: 'tsc --noEmit',
    label: 'Type-checking',
    success: 'Type-checking passed. Your types are solid.',
    fail: 'Type-checking failed. Fix type errors before proceeding.',
  },
];

/**
 * Execute all checks in order
 * Stops at the first failure (process.exit in runCheck)
 */
for (const { command, label, success, fail } of checks) {
  runCheck(command, label, success, fail, config.debug);
}
