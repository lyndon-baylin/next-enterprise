#!/usr/bin/env tsx

/**
 * Peer Dependency Checker (pnpm-friendly)
 *
 * - Scans installed packages under node_modules (direct + transitive)
 * - For each package with peerDependencies, resolves peer versions as Node would
 *   (walks up from that package directory looking for node_modules/<peer>)
 * - Prints issues + suggested pnpm commands
 * - Exits non-zero in CI or --strict mode if issues found
 *
 * Flags:
 *   --quiet     Only print satisfied checks? (prints only issues; still prints summaries)
 *   --json      Machine-readable JSON output
 *   --strict    Exit 1 if issues found (also enabled automatically when CI=true)
 *   --root <p>  Project root (defaults to .. relative to this script)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import semver from 'semver';

// -----------------------------
// Types
// -----------------------------

interface PackageJson {
  name: string;
  version: string;
  peerDependencies?: Record<string, string>;
}

interface PackageInfo {
  pkg: PackageJson;
  dir: string; // directory containing package.json
}

type PeerCheckResult =
  | { status: 'satisfied'; peer: string; version: string; range: string; resolvedFrom: string }
  | { status: 'missing'; peer: string; range: string; searchedFrom: string }
  | { status: 'mismatched'; peer: string; version: string; range: string; resolvedFrom: string }
  | { status: 'invalid-range'; peer: string; range: string; reason: string }
  | { status: 'invalid-version'; peer: string; version: string; range: string; reason: string; resolvedFrom: string };

type NonSatisfiedResult = Exclude<PeerCheckResult, { status: 'satisfied' }>;

interface Summary {
  satisfied: number;
  mismatched: number;
  missing: number;
  invalidRange: number;
  invalidVersion: number;
}

interface Issue {
  pkg: string;
  pkgVersion: string;
  peer: string;
  range: string;
  status: PeerCheckResult['status'];
  installed?: string;
  resolvedFrom?: string;
  searchedFrom?: string;
  reason?: string;
  suggestion?: string;
}

// -----------------------------
// CLI flags
// -----------------------------

const argv = process.argv.slice(2);
const args = new Set(argv);

const QUIET = args.has('--quiet');
const JSON_OUT = args.has('--json');
const STRICT = args.has('--strict') || process.env.CI === 'true';

const ROOT = (() => {
  const i = argv.indexOf('--root');
  if (i !== -1 && argv[i + 1]) return path.resolve(argv[i + 1] ?? '');
  return null;
})();

// -----------------------------
// Setup
// -----------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// default: repo root is parent of this script's directory
const projectRoot = ROOT ?? path.resolve(__dirname, '..');
const nodeModulesPath = path.join(projectRoot, 'node_modules');

// cache reads by package.json path
const pkgCache = new Map<string, PackageJson>();

// -----------------------------
// Helpers
// -----------------------------

function emptySummary(): Summary {
  return { satisfied: 0, mismatched: 0, missing: 0, invalidRange: 0, invalidVersion: 0 };
}

function getPerPackageSummary(perPackage: Record<string, Summary>, pkgName: string): Summary {
  return (perPackage[pkgName] ??= emptySummary());
}

function ensureNodeModulesOrExit(): void {
  if (fs.existsSync(nodeModulesPath)) return;
  console.error(`node_modules not found at: ${nodeModulesPath}`);
  process.exit(2);
}

function safeReadJson(filePath: string): unknown | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
  } catch {
    return null;
  }
}

function readPackageJson(pkgJsonPath: string): PackageJson | null {
  const cached = pkgCache.get(pkgJsonPath);
  if (cached) return cached;

  const raw = safeReadJson(pkgJsonPath);
  if (!raw || typeof raw !== 'object') return null;

  const obj = raw as Partial<PackageJson>;
  if (!obj.name || !obj.version) return null;

  const pkg: PackageJson = {
    name: obj.name,
    version: obj.version,
    peerDependencies: obj.peerDependencies ?? undefined,
  };

  pkgCache.set(pkgJsonPath, pkg);
  return pkg;
}

/**
 * Walk node_modules and collect every installed package directory.
 * Uses realpath-based visited set to avoid re-walking same physical directories (pnpm symlinks).
 */
function collectPackages(startNodeModules: string): PackageInfo[] {
  const results: PackageInfo[] = [];
  const visitedDirs = new Set<string>();

  function walk(dir: string): void {
    if (!fs.existsSync(dir)) return;

    let real: string;
    try {
      real = fs.realpathSync(dir);
    } catch {
      return;
    }
    if (visitedDirs.has(real)) return;
    visitedDirs.add(real);

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;

      const name = ent.name;
      if (name.startsWith('.')) continue;

      // scope folder
      if (name.startsWith('@')) {
        walk(path.join(dir, name));
        continue;
      }

      const pkgDir = path.join(dir, name);
      const pkgJsonPath = path.join(pkgDir, 'package.json');
      if (!fs.existsSync(pkgJsonPath)) continue;

      const pkg = readPackageJson(pkgJsonPath);
      if (!pkg) continue;

      results.push({ pkg, dir: pkgDir });

      // nested node_modules (important for non-hoisted installs)
      const nested = path.join(pkgDir, 'node_modules');
      if (fs.existsSync(nested)) walk(nested);
    }
  }

  walk(startNodeModules);
  return results;
}

function peerPackageJsonPath(peerName: string): string {
  // supports scoped peers
  const parts = peerName.split('/');
  return parts[0]?.startsWith('@')
    ? path.join('node_modules', parts[0], parts[1] ?? '', 'package.json')
    : path.join('node_modules', peerName, 'package.json');
}

/**
 * Resolve a peer package version from the perspective of `fromDir`,
 * walking up parent directories like Node does.
 */
function resolvePeerFrom(fromDir: string, peerName: string, stopAt: string): { pkg: PackageJson; from: string } | null {
  let current = fromDir;

  while (true) {
    const candidate = path.join(current, peerPackageJsonPath(peerName));
    if (fs.existsSync(candidate)) {
      const pkg = readPackageJson(candidate);
      if (pkg) return { pkg, from: path.dirname(candidate) };
    }

    if (current === stopAt) break;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return null;
}

function validatePeerDependency(fromPkg: PackageInfo, peer: string, range: string): PeerCheckResult {
  // handle non-semver ranges gracefully
  const validRange = semver.validRange(range, { includePrerelease: true });
  if (!validRange) {
    return {
      status: 'invalid-range',
      peer,
      range,
      reason: 'Not a valid semver range (workspace:/link:/file:/npm: etc?)',
    };
  }

  const resolved = resolvePeerFrom(fromPkg.dir, peer, projectRoot);
  if (!resolved) {
    return { status: 'missing', peer, range, searchedFrom: fromPkg.dir };
  }

  const installedVersion = resolved.pkg.version;

  const validVersion = semver.valid(installedVersion);
  if (!validVersion) {
    return {
      status: 'invalid-version',
      peer,
      version: installedVersion,
      range: validRange,
      reason: 'Installed version is not valid semver',
      resolvedFrom: resolved.from,
    };
  }

  const ok = semver.satisfies(validVersion, validRange, { includePrerelease: true });
  if (!ok) {
    return { status: 'mismatched', peer, version: validVersion, range: validRange, resolvedFrom: resolved.from };
  }

  return { status: 'satisfied', peer, version: validVersion, range: validRange, resolvedFrom: resolved.from };
}

function formatFixSuggestion(peer: string, range: string): string {
  // use workspace root install as the most common peer fix
  return `pnpm add -w ${peer}@"${range}"`;
}

// -----------------------------
// Refactor: Variant A (dispatch table for non-satisfied results)
// -----------------------------

interface IssueHandlerCtx {
  base: Pick<Issue, 'pkg' | 'pkgVersion' | 'peer' | 'range' | 'status'>;
  peer: string;
  range: string;
  perPkg: Summary;
  global: Summary;
  issues: Issue[];
}

type StatusHandler<T extends NonSatisfiedResult['status']> = (
  ctx: IssueHandlerCtx,
  result: Extract<NonSatisfiedResult, { status: T }>
) => void;

const issueHandlers: { [K in NonSatisfiedResult['status']]: StatusHandler<K> } = {
  missing: (ctx, r) => {
    ctx.global.missing++;
    ctx.perPkg.missing++;
    ctx.issues.push({
      ...ctx.base,
      searchedFrom: r.searchedFrom,
      suggestion: formatFixSuggestion(ctx.peer, ctx.range),
    });
  },

  mismatched: (ctx, r) => {
    ctx.global.mismatched++;
    ctx.perPkg.mismatched++;
    ctx.issues.push({
      ...ctx.base,
      installed: r.version,
      resolvedFrom: r.resolvedFrom,
      suggestion: formatFixSuggestion(ctx.peer, r.range),
    });
  },

  'invalid-range': (ctx, r) => {
    ctx.global.invalidRange++;
    ctx.perPkg.invalidRange++;
    ctx.issues.push({ ...ctx.base, reason: r.reason });
  },

  'invalid-version': (ctx, r) => {
    ctx.global.invalidVersion++;
    ctx.perPkg.invalidVersion++;
    ctx.issues.push({
      ...ctx.base,
      installed: r.version,
      resolvedFrom: r.resolvedFrom,
      reason: r.reason,
    });
  },
};

function recordNonSatisfied(params: {
  pkgName: string;
  pkgVersion: string;
  peer: string;
  range: string;
  result: NonSatisfiedResult;
  perPkg: Summary;
  global: Summary;
  issues: Issue[];
}): void {
  const { pkgName, pkgVersion, peer, range, result, perPkg, global, issues } = params;

  const base: Pick<Issue, 'pkg' | 'pkgVersion' | 'peer' | 'range' | 'status'> = {
    pkg: pkgName,
    pkgVersion,
    peer,
    range,
    status: result.status,
  };

  const ctx: IssueHandlerCtx = { base, peer, range, perPkg, global, issues };

  // dispatch (single branching point)
  (issueHandlers[result.status] as unknown as (c: IssueHandlerCtx, r: NonSatisfiedResult) => void)(ctx, result);
}

// -----------------------------
// Refactor: Variant C (dispatch table for issue printing)
// -----------------------------

type PrintFn = (i: Issue) => void;

const issuePrinters: Record<Issue['status'], PrintFn> = {
  missing: (i) => {
    console.warn(`❌ ${i.pkg}@${i.pkgVersion} missing peer: ${i.peer} (required ${i.range})`);
    console.log(`   searched from: ${i.searchedFrom}`);
    if (i.suggestion) console.log(`   👉 Run: ${i.suggestion}`);
    console.log('');
  },

  mismatched: (i) => {
    console.warn(
      `⚠️ ${i.pkg}@${i.pkgVersion} peer mismatch: ${i.peer} installed ${i.installed} but requires ${i.range}`
    );
    if (i.resolvedFrom) console.log(`   resolved from: ${i.resolvedFrom}`);
    if (i.suggestion) console.log(`   👉 Run: ${i.suggestion}`);
    console.log('');
  },

  'invalid-range': (i) => {
    console.warn(`⚠️ ${i.pkg}@${i.pkgVersion} peer check skipped: ${i.peer} (${i.range})`);
    if (i.reason) console.log(`   reason: ${i.reason}`);
    console.log('');
  },

  'invalid-version': (i) => {
    console.warn(`⚠️ ${i.pkg}@${i.pkgVersion} peer check skipped: ${i.peer} (${i.range})`);
    if (i.reason) console.log(`   reason: ${i.reason}`);
    console.log('');
  },

  // This should never be called because we only print issues (non-satisfied),
  // but must exist to satisfy Record<Issue['status'], PrintFn>
  satisfied: (i) => {
    if (!QUIET) console.log(`✅ ${i.pkg} peer satisfied: ${i.peer} (${i.range})`);
  },
};

function printIssue(i: Issue): void {
  issuePrinters[i.status](i);
}

// -----------------------------
// Reporting
// -----------------------------

function printJsonReport(summary: Summary, perPackage: Record<string, Summary>, issues: Issue[]): void {
  console.log(
    JSON.stringify(
      {
        projectRoot,
        nodeModulesPath,
        summary,
        perPackage,
        issues,
      },
      null,
      2
    )
  );
}

function printTextReport(summary: Summary, perPackage: Record<string, Summary>, issues: Issue[]): void {
  if (issues.length) {
    console.log('\n⚠️ Peer dependency issues found:\n');
    for (const i of issues) printIssue(i);
  }

  console.log('📊 Global Summary:');
  console.log('   ✅ Satisfied     :', summary.satisfied);
  console.log('   ⚠️ Mismatched    :', summary.mismatched);
  console.log('   ❌ Missing       :', summary.missing);
  console.log('   🟦 Invalid ranges:', summary.invalidRange);
  console.log('   🟪 Invalid vers. :', summary.invalidVersion);

  // print only packages with issues, sorted by total issues desc
  const entries = Object.entries(perPackage)
    .map(([name, s]) => ({ name, ...s, issues: s.mismatched + s.missing + s.invalidRange + s.invalidVersion }))
    .filter((x) => x.issues > 0)
    .sort((a, b) => b.issues - a.issues);

  if (entries.length) {
    console.log('\n📦 Per-package (only with issues):');
    for (const e of entries) {
      console.log(
        `   ${e.name}: ❌ ${e.missing}  ⚠️ ${e.mismatched}  🟦 ${e.invalidRange}  🟪 ${e.invalidVersion}  (✅ ${e.satisfied})`
      );
    }
  } else if (!QUIET) {
    console.log('\n📦 Per-package: no issues.');
  }
}

function exitWithStatus(issues: Issue[]): never {
  const hasBlockingIssues = issues.some((i) => i.status === 'missing' || i.status === 'mismatched');

  if (!hasBlockingIssues) {
    if (!JSON_OUT) console.log('\n🎉 All peer dependencies are satisfied!');
    process.exit(0);
  }

  if (STRICT) {
    if (!JSON_OUT) console.error('\n🚨 Strict mode: failing due to peer dependency issues.');
    process.exit(1);
  }

  if (!JSON_OUT) console.log('\nℹ️ Issues detected (non-strict mode). Use --strict or CI=true to fail.');
  process.exit(0);
}

// -----------------------------
// Run
// -----------------------------

function run(): void {
  ensureNodeModulesOrExit();

  const packages = collectPackages(nodeModulesPath);

  const summary: Summary = emptySummary();
  const perPackage: Record<string, Summary> = {};
  const issues: Issue[] = [];

  for (const info of packages) {
    const peers = info.pkg.peerDependencies;
    if (!peers) continue;

    const perPkgSummary = getPerPackageSummary(perPackage, info.pkg.name);

    for (const [peer, range] of Object.entries(peers)) {
      const result = validatePeerDependency(info, peer, range);

      if (result.status === 'satisfied') {
        summary.satisfied++;
        perPkgSummary.satisfied++;

        if (!QUIET) {
          console.log(`✅ ${info.pkg.name} -> ${peer}@${result.version} satisfies ${result.range}`);
        }
        continue;
      }

      recordNonSatisfied({
        pkgName: info.pkg.name,
        pkgVersion: info.pkg.version,
        peer,
        range,
        result,
        perPkg: perPkgSummary,
        global: summary,
        issues,
      });
    }
  }

  if (JSON_OUT) {
    printJsonReport(summary, perPackage, issues);
  } else {
    printTextReport(summary, perPackage, issues);
  }

  exitWithStatus(issues);
}

run();
