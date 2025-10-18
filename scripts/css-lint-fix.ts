// scripts/checks.ts

import chalk from 'chalk';

import { execSync } from 'node:child_process';

/**
 * Runs a check command and logs success or failure messages.
 * @param {string} command The command to run.
 * @param {string} successMsg The message to log on success.
 * @param {string} failMsg The message to log on failure.
 */
function runCheck(command: string, label: string, successMsg: string, failMsg: string) {
  console.log('\n🔍 ' + chalk.gray(`${label} in progress…`));
  console.time('⏱️ ' + chalk.cyan(`${label} duration`));
  try {
    execSync(command, { stdio: 'inherit' });
    console.timeEnd('⏱️ ' + chalk.cyan(`${label} duration`));
    console.log('✅ ' + chalk.greenBright(successMsg));
  } catch {
    console.timeEnd('⏱️ ' + chalk.cyan(`${label} duration`));
    console.error('❌ ' + chalk.redBright(failMsg));
    process.exit(1);
  }
}

runCheck(
  'stylelint "**/*.css" --fix',
  'Fixing',
  'Linting issues are now fixed. Your css code is clean and mean!',
  'Fixing linting issues failed. Please try again.'
);
