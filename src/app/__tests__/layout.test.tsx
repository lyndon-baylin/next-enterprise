import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('geist/font/sans', () => ({
  GeistSans: () => ({
    className: 'geistSans',
    variable: '--font-geist-sans',
  }),
}));

vi.mock('geist/font/mono', () => ({
  GeistMono: () => ({
    className: 'geistMono',
    variable: '--font-geist-mono',
  }),
}));

import { RootLayoutBody } from '../layout';

test('Renders layout with children', () => {
  render(
    <RootLayoutBody>
      <h1>NextJS Boilerplate</h1>
    </RootLayoutBody>
  );

  expect(screen.getByText('NextJS Boilerplate')).toBeInTheDocument();
});
