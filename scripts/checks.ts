// scripts/checks.ts
import { execSync } from 'child_process';

function runCheck(command: string, successMsg: string, failMsg: string) {
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`\n✅ ${successMsg}`);
  } catch {
    console.error(`\n❌ ${failMsg}`);
    process.exit(1);
  }
}

runCheck(
  'eslint . "**/*.{js,jsx,ts,tsx}"',
  'Linting passed. Your code is clean and mean!',
  'Linting failed. Fix issues before committing.'
);
runCheck(
  'tsc --noEmit',
  'Type-checking passed. Your types are solid.',
  'Type-checking failed. Fix type errors before proceeding.'
);
