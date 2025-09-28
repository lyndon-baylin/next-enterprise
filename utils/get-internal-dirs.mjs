import fs from 'node:fs';
import path from 'node:path';

/**
 * Collects internal directories/aliases from tsconfig.json
 * - Reads `compilerOptions.baseUrl` (default: "src")
 * - Reads `compilerOptions.paths` for aliases
 *
 * @param {string} [tsconfigPath="tsconfig.json"]
 * @returns {string[]} List of directories/aliases
 */
export function getInternalDirs(tsconfigPath = 'tsconfig.json') {
  const tsconfigFile = path.resolve(process.cwd(), tsconfigPath);

  if (!fs.existsSync(tsconfigFile)) {
    return [];
  }

  const raw = fs.readFileSync(tsconfigFile, 'utf8');
  /** @type {{ compilerOptions?: { baseUrl?: string, paths?: Record<string, string[]> } }} */
  const tsconfig = JSON.parse(raw);

  const baseUrl = tsconfig.compilerOptions?.baseUrl ?? 'src';
  const baseDir = path.resolve(process.cwd(), baseUrl);

  const dirs = [];

  // 1. Physical directories inside baseUrl
  if (fs.existsSync(baseDir)) {
    const physicalDirs = fs
      .readdirSync(baseDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    dirs.push(...physicalDirs);
  }

  // 2. Aliases from paths (e.g. "@/*": ["src/*"])
  if (tsconfig.compilerOptions?.paths) {
    for (const alias of Object.keys(tsconfig.compilerOptions.paths)) {
      // Remove trailing wildcards like `/*`
      const cleanAlias = alias.replace(/\/\*$/, '');
      if (!dirs.includes(cleanAlias)) {
        dirs.push(cleanAlias);
      }
    }
  }

  return dirs;
}
