# Repository Commit

## Code commit

In order to help enforce a consistent commit convention in your project just follow this pattern, where the keyword `chore` is an enum-type [rule](https://commitlint.js.org/reference/rules.html).

```shell
git commit -m "chore(docs): initial commit"
```

Below is the list of enum-type rules and its description

- `build` Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
- `chore` Other changes that don't modify src or test files
- `ci` Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
- `docs` Documentation only changes
- `feat` A new feature
- `fix` A bug fix
- `perf` A code change that improves performance
- `refactor` A code change that neither fixes a bug nor adds a feature
- `revert` Reverts a previous commit
- `style` Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- `test` Adding missing tests or correcting existing tests
- `translation` Language translation
- `security` Security fixes
- `changeset` Changeset

Below is the list scope-enum which required when committing into the repo.

- `api`
- `app`
- `auth`
- `cli`
- `config`
- `core`
- `db`
- `deps`
- `docs`
- `examples`
- `infra`
- `lib`
- `models`
- `plugins`
- `public`
- `scripts`
- `services`
- `tests`
- `ui`
- `utils`

```shell
git commit -m "feat(api): add new endpoint for user authentication"
```
