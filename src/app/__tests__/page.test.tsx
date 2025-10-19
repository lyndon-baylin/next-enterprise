import { render, screen } from '@testing-library/react';

import Home from '../page';

test('Renders `Next Enterprise Boilerplate` on the page', () => {
  render(<Home />);

  const h1 = screen.getByRole('heading', { name: /Next Enterprise Boilerplate/i });
  expect(h1).toBeInTheDocument();
});
