#!/usr/bin/env tsx

/**
 * Peer Dependency Checker
 *
 * - Checks ALL installed packages (direct + transitive) for peer dependency issues
 * - Suggests `pnpm` commands to fix mismatches
 * - Exits with non-zero code in CI mode if issues are found
 *
 * Next.js 15 / TS 5 friendly (moduleResolution: bundler)
 */

import * as semver from 'Semver';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// -----------------------------
// Types
// -----------------------------

interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

interface PackageInfo {
  pkg: PackageJson;
  dir: string;
}

interface Summary {
  satisfied: number;
  mismatched: number;
  missing: number;
}

type PeerCheckResult =
  | { status: 'satisfied'; peer: string; version: string; range: string }
  | { status: 'missing'; peer: string; range: string }
  | { status: 'mismatched'; peer: string; version: string; range: string };

// -----------------------------
// Setup
// -----------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nodeModulesPath: string = path.resolve(__dirname, '../node_modules');

const pkgCache = new Map<string, PackageJson>();

// -----------------------------
// Helpers
// -----------------------------

function readPackageJson(pkgPath: string): PackageJson | null {
  try {
    const cached = pkgCache.get(pkgPath);
    if (cached) return cached;

    const raw = fs.readFileSync(pkgPath, 'utf8');
    const content: PackageJson = JSON.parse(raw) as PackageJson;
    pkgCache.set(pkgPath, content);
    return content;
  } catch {
    return null;
  }
}

function walkNodeModules(startPath: string): Map<string, PackageInfo> {
  const results = new Map<string, PackageInfo>();

  function walk(dir: string): void {
    if (!fs.existsSync(dir)) return;

    for (const entry of fs.readdirSync(dir)) {
      if (entry.startsWith('.')) continue;

      // Scoped packages
      if (entry.startsWith('@')) {
        walk(path.join(dir, entry));
        continue;
      }

      const pkgPath = path.join(dir, entry, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = readPackageJson(pkgPath);
        if (pkg) {
          results.set(pkg.name, { pkg, dir: path.join(dir, entry) });

          // Dive into nested node_modules
          const nestedModules = path.join(dir, entry, 'node_modules');
          if (fs.existsSync(nestedModules)) {
            walk(nestedModules);
          }
        }
      }
    }
  }

  walk(startPath);
  return results;
}

function validatePeerDependency(
  pkgName: string,
  peer: string,
  range: string,
  allPackages: Map<string, PackageInfo>
): PeerCheckResult {
  const peerPkg = allPackages.get(peer)?.pkg;

  if (!peerPkg) {
    return { status: 'missing', peer, range };
  }

  const installedVersion: string = peerPkg.version;
  const isValid = semver.satisfies(installedVersion, range, {
    includePrerelease: true,
  });

  if (!isValid) {
    return { status: 'mismatched', peer, version: installedVersion, range };
  }

  return { status: 'satisfied', peer, version: installedVersion, range };
}

function printSummary(globalSummary: Summary, perPackageSummary: Record<string, Summary>): void {
  console.log('\n📊 Global Peer Dependency Summary:');
  console.log('   ✅ Satisfied :', globalSummary.satisfied);
  console.log('   ⚠️  Mismatched:', globalSummary.mismatched);
  console.log('   ❌ Missing   :', globalSummary.missing);

  console.log('\n📦 Per-Package Summary:');
  for (const [pkg, summary] of Object.entries(perPackageSummary)) {
    console.log(`   ${pkg}:`, '✅', summary.satisfied, '⚠️', summary.mismatched, '❌', summary.missing);
  }
}

// -----------------------------
// Main Logic
// -----------------------------

function checkPeerDependencies(allPackages: Map<string, PackageInfo>): void {
  let hasIssues = false;

  const globalSummary: Summary = { satisfied: 0, mismatched: 0, missing: 0 };
  const perPackageSummary: Record<string, Summary> = {};

  for (const { pkg } of allPackages.values()) {
    if (!pkg.peerDependencies) continue;

    console.log('\n🔎 Checking peer deps for:', pkg.name);

    for (const [peer, range] of Object.entries(pkg.peerDependencies)) {
      // ensure package summary exists
      const summary = (perPackageSummary[pkg.name] ??= {
        satisfied: 0,
        mismatched: 0,
        missing: 0,
      });

      const result = validatePeerDependency(pkg.name, peer, range, allPackages);

      switch (result.status) {
        case 'missing':
          hasIssues = true;
          globalSummary.missing++;
          summary.missing++;
          console.warn('❌ Missing peer dependency:', result.peer, '(required', result.range + ')');
          console.log('👉 Run: pnpm add', `${result.peer}@"${result.range}"`);
          break;

        case 'mismatched':
          hasIssues = true;
          globalSummary.mismatched++;
          summary.mismatched++;
          console.warn(
            '⚠️  Version mismatch:',
            result.peer,
            'installed',
            result.version + ',',
            'but',
            pkg.name,
            'requires',
            result.range
          );
          console.log('👉 Run: pnpm add', `${result.peer}@"${result.range}"`);
          break;

        case 'satisfied':
          globalSummary.satisfied++;
          summary.satisfied++;
          console.log('✅', `${result.peer}@${result.version}`, 'satisfies', result.range);
          break;
      }
    }
  }

  printSummary(globalSummary, perPackageSummary);

  if (!hasIssues) {
    console.log('\n🎉 All peer dependencies (direct + transitive) are satisfied!');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some peer dependencies need fixing (see suggestions above).');
    if (process.env.CI === 'true') {
      console.error('\n🚨 CI mode enabled: failing build due to peer dependency issues.');
      process.exit(1);
    }
  }
}

// -----------------------------
// Run
// -----------------------------

const allPackages = walkNodeModules(nodeModulesPath);
checkPeerDependencies(allPackages);
