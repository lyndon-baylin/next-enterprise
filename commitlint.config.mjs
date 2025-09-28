/**
 * commitlint configuration
 *
 * @see https://commitlint.js.org/reference/configuration.html
 * @see https://commitlint.js.org/reference/rules.html
 */
const commitLintConfig = {
  /**
   * Resolve and load @commitlint/config-conventional from node_modules.
   * Referenced packages must be installed
   */
  extends: ['@commitlint/config-conventional'],
  // Enforces a maximum header length of 150 characters.
  'header-max-length': [2, 'always', 150],
  // Disallows empty subjects.
  'subject-empty': [2, 'never'],
  // Disallows empty types.
  'type-empty': [2, 'never'],
  // Restricts types to a specific set of values (e.g., build, chore, ci, etc.).
  'type-enum': [
    2,
    'always',
    [
      'build',
      'chore',
      'ci',
      'docs',
      'feat',
      'fix',
      'perf',
      'refactor',
      'revert',
      'style',
      'test',
      'release',
      'security',
      'deps',
    ],
  ],
  // This enforces that the subject of a commit message should not be written in these case styles.
  // Forbidden styles are `sentence-case`, `start-case`, `pascal-case`, `upper-case`, and `lower-case`.
  'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
  // Disallows full stops at the end of subjects.
  'subject-full-stop': [2, 'never', '.'],
  // Enforces a leading blank line in the body.
  'body-leading-blank': [2, 'always'],
  // Enforces a maximum line length of 120 characters in the body.
  'body-max-line-length': [2, 'always', 120],
  // Enforces a leading blank line in the footer.
  'footer-leading-blank': [2, 'always'],
  // Enforces a maximum line length of 120 characters in the footer.
  'footer-max-line-length': [2, 'always', 120],
  // Enforces kebab-case for scopes.
  'scope-case': [2, 'always', 'kebab-case'],
  // Disallows empty scopes.
  'scope-empty': [2, 'never'],
  // Restricts scopes to a specific set of values (e.g., api, app, auth, etc.).
  'scope-enum': [
    2,
    'always',
    [
      'api',
      'app',
      'auth',
      'cli',
      'config',
      'core',
      'db',
      'docs',
      'examples',
      'infra',
      'lib',
      'models',
      'plugins',
      'public',
      'scripts',
      'services',
      'tests',
      'ui',
      'utils',
    ],
  ],
};

export default commitLintConfig;

/**
 * Here is an example of a Git commit that conforms to the commitlint settings:
 *
  git commit -m "feat(api): add new endpoint for user authentication

  This commit adds a new endpoint for user authentication in the API.

  The new endpoint is located at `/api/auth/login` and accepts a JSON payload with the user's credentials.

  Resolves issue #123"
 */
