# 📝 Renovate Onboarding Checklist

When Renovate runs (every 17th of the month), here’s how to handle updates:

1. Check the Dependency Dashboard

- Go to the Dependency Dashboard issue in GitHub.
- Look for items labeled:
- major-upgrade → Major framework/compiler releases (e.g., React, Next.js, TypeScript).
- lockfile-maintenance → Lockfile refresh tasks.
- Approve items you want Renovate to open PRs for by ticking the checkbox.

2. Review Safe Updates

- Minor/patch updates will already have PRs created.
- These are grouped by ecosystem (linting, testing, tooling, etc.).
- Review the changelog linked in each PR.
- Merge once verified — no auto‑merge for core frameworks.

3. Handle Major Upgrades

- Major upgrades are gated:
- Approve them in the dashboard when you’re ready to plan migration.
- Renovate will then open a PR labeled major-upgrade.
- Only one major PR per ecosystem will be open at a time (thanks to concurrency limits).

4. Lockfile Maintenance

- Lockfile updates are listed in the dashboard.
- Approve them when you want Renovate to refresh lockfiles.
- PRs will be labeled `lockfile-maintenance`.

5. Keep Workflow Predictable

- Expect updates only once per month (17th day).
- Safe updates flow automatically, majors and lockfiles require explicit approval.
- Labels make PRs easy to spot and prioritize.
