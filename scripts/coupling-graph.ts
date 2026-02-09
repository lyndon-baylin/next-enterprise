import { execSync, spawnSync } from 'child_process';

import chalk from 'chalk';

// Helper: check if Graphviz is installed
function hasGraphviz() {
  try {
    const result = spawnSync('dot', ['-V'], { encoding: 'utf8' });
    return result.status === 0;
  } catch {
    return false;
  }
}

const args = [
  '--extensions',
  'ts,tsx,js,jsx,css,md,mdx',
  './src',
  '--exclude',
  '.next|tailwind.config.mjs|reset.d.ts|prettier.config.mjs|postcss.config.mjs|playwright.config.ts|next.config.ts|next-env.d.ts|instrumentation.ts|e2e/|README.md|.storybook/|.husky/|.vscode/|html/|.eslint.config.mjs',
];

if (hasGraphviz()) {
  console.log('✅ ' + 'Graphviz detected. Generating graph.svg...');
  execSync(`madge ${args.join(' ')} --image graph.svg`, { stdio: 'inherit' });
  console.log('📊 Dependency graph written to graph.svg');
} else {
  console.warn('⚠️ ' + chalk.yellow(`Graphviz not installed. Skipping SVG generation.`));
  console.log('👉 ' + chalk.cyan(`You can still run circular checks with:`));
  console.log(chalk.blue('   pnpm run check-circular'));
}
