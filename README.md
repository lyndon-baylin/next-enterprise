# next-enterprise

A production-ready Next.js boilerplate inspired by Blazity’s next-enterprise. This boilerplate will serve as a strong foundation for modern web applications, incorporating best practices in architecture, scalability, developer experience, and maintainability.

## Getting Started

### Installation

1. Make sure you have `node >= 20` and `pnpm >= 10.14.0` installed
2. Clone the repository using git clone --depth=1 <https://github.com/lyndon-baylin/next-enterprise.git> <YOUR_PROJECT_NAME>

```shell
git clone --depth=1 https://github.com/lyndon-baylin/next-enterprise.git next-boilerplate
```

3. Move to the appropriate directory: cd <YOUR_PROJECT_NAME>

4. Enable corepack

```shell
corepack enable && corepack enable npm
```

This needs to be done only once - you do not need to run it again for other projects. The `corepack enable npm` command may seem unreasonable as we are using `pnpm`. It is well explained in the [Matt's TotalTypeScript](https://www.totaltypescript.com/how-to-use-corepack#why-do-we-need-corepack-enable-npm)

5. Install dependencies

```shell
pnpm install --frozen-lockfile
```

6. Run the project

```shell
pnpm dev
```

You can now begin the development on your project. HAPPY CODING 😄💻♥️

### Code commit

In order to help enforce a consistent commit convention in your project just follow this pattern, where the keyword `chore` is an enum-type [rule](https://commitlint.js.org/reference/rules.html).

```shell
git commit -m "chore: initial commit"
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
