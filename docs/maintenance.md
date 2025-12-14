# Dependency Maintenance

## Renovate Workflow

This project uses Renovate to keep dependencies up to date in a safe, predictable way.

#### 📅 Update Schedule

- Renovate runs once per month on the 17th day, between 1am–4am Asia/Manila time.
- All dependency updates (minor, patch, major, lockfile maintenance) respect this schedule.

#### ✅ Safe Updates

- Minor & patch updates for most dependencies flow automatically on the 17th.
- These updates are grouped by ecosystem (e.g., TypeScript tooling, React/Next.js core, linting/testing tools).
- PRs are created but require manual review before merging (no auto‑merge for core frameworks).

#### ⚠️ Major Upgrades

- Major updates (e.g., TypeScript 5 → 6, React 18 → 19, Next.js 14 → 15) are:
- Isolated into their own PR groups.
- Labeled with major-upgrade for visibility.
- Require explicit approval in the Dependency Dashboard before Renovate will open PRs.
- Limited to 1 concurrent PR per ecosystem to avoid overload.

#### 🔒 Lockfile Maintenance

- Lockfile updates are scheduled monthly (before 3am on the 17th).
- They are labeled lockfile-maintenance.
- Require dashboard approval before PRs are created.

#### 🧭 Why This Setup?

- Keeps the repo stable by avoiding surprise major upgrades.
- Ensures visibility into important releases without overwhelming the team.
- Provides a predictable monthly cadence for dependency hygiene.
- Balances automation with deliberate human review.
