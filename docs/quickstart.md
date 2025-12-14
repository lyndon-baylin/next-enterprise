# Quick Start

## Installation

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
