/**
 * This imports Vitest’s expect function, which is used to write assertions like:
 *
 * ```ts
 * expect(element).toBeInTheDocument();
 * ```
 */
import * as matchers from '@testing-library/jest-dom/matchers';
/**
 * This brings in custom matchers from @testing-library/jest-dom, such as:
 * - `toHaveTextContent()`
 * - `toHaveAttribute()`
 * - `toBeVisible()`
 * - `toBeInTheDocument()`
 *
 * These matchers make your tests more expressive and readable compared to plain `expect(...).toBe(true)`.
 */
import { expect } from 'vitest';

/**
 * jest-dom adds custom jest matchers for asserting on DOM nodes.
 * allows you to do things like:
 * expect(element).toHaveTextContent(/react/i)
 * learn more: https://github.com/testing-library/jest-dom
 *
 * Why We Need This?
 * By default, Vitest doesn’t include Testing Library’s matchers. Without this setup, you'd get errors like:
 *
 * `expect(...).toHaveTextContent is not a function`
 *
 */
expect.extend(matchers);
