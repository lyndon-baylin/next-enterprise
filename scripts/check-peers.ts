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
 *   --quiet           Reduce output (suppresses satisfied lines)
 *   --json            Machine-readable JSON output
 *   --strict          Exit 1 if missing/mismatched peers found (also enabled automatically when CI=true)
 *   --root <p>        Project root (defaults to .. relative to this script)
 *   --only <pkg>      Only check peer deps declared by packages matching <pkg> (repeatable)
 *   --peer <peerName> Only check peer deps whose name matches <peerName> (repeatable)
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

interface Filters {
  onlyPkgs: string[]; // match packages by name
  peers: string[]; // match peer dependency name
}

// -----------------------------
// CLI parsing
// -----------------------------

const argv = process.argv.slice(2);
const args = new Set(argv);

const QUIET = args.has('--quiet');
const JSON_OUT = args.has('--json');
const STRICT = args.has('--strict') || process.env.CI === 'true';

function readFlagValues(flag: string): string[] {
  const out: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== flag) continue;

    const next = argv[i + 1];
    if (typeof next !== 'string' || next.startsWith('--')) continue;

    out.push(next);
    i++; // skip the consumed value
  }

  return out;
}

const ROOT = (() => {
  const i = argv.indexOf('--root');
  if (i === -1) return null;

  const next = argv[i + 1];
  if (typeof next !== 'string' || next.startsWith('--')) return null;

  return path.resolve(next);
})();

const filters: Filters = {
  onlyPkgs: readFlagValues('--only'),
  peers: readFlagValues('--peer'),
};

function matchesAnyNeedle(haystack: string, needles: string[]): boolean {
  if (needles.length === 0) return true;
  const h = haystack.toLowerCase();
  return needles.some((n) => h.includes(n.toLowerCase()));
}

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
// Shared helpers
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

function readPackageJsonIfExists(pkgJsonPath: string): PackageJson | null {
  if (!fs.existsSync(pkgJsonPath)) return null;
  return readPackageJson(pkgJsonPath);
}

// -----------------------------
// node_modules walker (symlink-safe + refactored)
// -----------------------------

function collectPackages(startNodeModules: string): PackageInfo[] {
  const results: PackageInfo[] = [];
  const visitedDirs = new Set<string>();

  function walk(dir: string): void {
    if (!canEnterDir(dir, visitedDirs)) return;

    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (!shouldConsiderEntry(ent, full)) continue;

      // Scoped packages (@scope/*)
      if (ent.name.startsWith('@')) {
        walk(full);
        continue;
      }

      const pkgJsonPath = path.join(full, 'package.json');
      const pkg = readPackageJsonIfExists(pkgJsonPath);
      if (!pkg) continue;

      results.push({ pkg, dir: full });

      const nested = path.join(full, 'node_modules');
      walkIfExists(nested, walk);
    }
  }

  walk(startNodeModules);
  return results;
}

function canEnterDir(dir: string, visitedDirs: Set<string>): boolean {
  if (!fs.existsSync(dir)) return false;

  const real = tryRealpath(dir);
  if (!real) return false;

  if (visitedDirs.has(real)) return false;
  visitedDirs.add(real);
  return true;
}

function tryRealpath(dir: string): string | null {
  try {
    return fs.realpathSync(dir);
  } catch {
    return null;
  }
}

/**
 * Skip dot entries and keep directories + symlinks-to-directories.
 * pnpm packages under node_modules are commonly symlinks to a directory in the pnpm store.
 */
function shouldConsiderEntry(ent: fs.Dirent, fullPath: string): boolean {
  if (ent.name.startsWith('.')) return false;
  if (ent.isDirectory()) return true;
  return ent.isSymbolicLink() && isSymlinkTargetDirectory(fullPath);
}

function isSymlinkTargetDirectory(fullPath: string): boolean {
  try {
    return fs.statSync(fullPath).isDirectory(); // follows symlink
  } catch {
    return false;
  }
}

function walkIfExists(dir: string, walk: (d: string) => void): void {
  if (fs.existsSync(dir)) walk(dir);
}

// -----------------------------
// Peer resolution and validation
// -----------------------------

function peerPackageJsonPath(peerName: string): string {
  // supports scoped peers (@scope/name)
  const parts = peerName.split('/');
  return parts[0]?.startsWith('@')
    ? path.join('node_modules', parts[0], parts[1] ?? '', 'package.json')
    : path.join('node_modules', peerName, 'package.json');
}

/**
 * Resolve a peer package from the perspective of `fromDir`,
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
  return `pnpm add -w ${peer}@"${range}"`;
}

// -----------------------------
// Variant A: dispatch table for non-satisfied results
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

  (issueHandlers[result.status] as unknown as (c: IssueHandlerCtx, r: NonSatisfiedResult) => void)(ctx, result);
}

// -----------------------------
// Variant C: dispatch table for issue printing
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
      `⚠️  ${i.pkg}@${i.pkgVersion} peer mismatch: ${i.peer} installed ${i.installed} but requires ${i.range}`
    );
    if (i.resolvedFrom) console.log(`   resolved from: ${i.resolvedFrom}`);
    if (i.suggestion) console.log(`   👉 Run: ${i.suggestion}`);
    console.log('');
  },

  'invalid-range': (i) => {
    console.warn(`⚠️  ${i.pkg}@${i.pkgVersion} peer check skipped: ${i.peer} (${i.range})`);
    if (i.reason) console.log(`   reason: ${i.reason}`);
    console.log('');
  },

  'invalid-version': (i) => {
    console.warn(`⚠️  ${i.pkg}@${i.pkgVersion} peer check skipped: ${i.peer} (${i.range})`);
    if (i.reason) console.log(`   reason: ${i.reason}`);
    console.log('');
  },

  // Not expected to be called (we only print issues), but required for Record completeness.
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

function printFilterHeader(): void {
  const only = filters.onlyPkgs.length ? filters.onlyPkgs.join(', ') : '(none)';
  const peer = filters.peers.length ? filters.peers.join(', ') : '(none)';
  console.log(`\n🔧 Filters: --only=[${only}] --peer=[${peer}]`);
}

function printJsonReport(summary: Summary, perPackage: Record<string, Summary>, issues: Issue[]): void {
  console.log(
    JSON.stringify(
      {
        projectRoot,
        nodeModulesPath,
        filters,
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
  printFilterHeader();

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

function shouldCheckPackage(pkgName: string): boolean {
  return matchesAnyNeedle(pkgName, filters.onlyPkgs);
}

function shouldCheckPeer(peerName: string): boolean {
  return matchesAnyNeedle(peerName, filters.peers);
}

function run(): void {
  ensureNodeModulesOrExit();

  const packages = collectPackages(nodeModulesPath);

  const summary: Summary = emptySummary();
  const perPackage: Record<string, Summary> = {};
  const issues: Issue[] = [];

  for (const info of packages) {
    if (!shouldCheckPackage(info.pkg.name)) continue;

    const peers = info.pkg.peerDependencies;
    if (!peers) continue;

    const perPkgSummary = getPerPackageSummary(perPackage, info.pkg.name);

    for (const [peer, range] of Object.entries(peers)) {
      if (!shouldCheckPeer(peer)) continue;

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
