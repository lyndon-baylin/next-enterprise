import { render, screen } from '@testing-library/react';

import Home from '../page';

test('Renders two button links on the page', () => {
  render(<Home />);
  const deployNowButton = screen.getByRole('link', { name: /Deploy now/i });
  const readOurDocsButton = screen.getByRole('link', { name: /Read our docs/i });

  expect(deployNowButton).toBeInTheDocument();
  expect(deployNowButton).toHaveAttribute(
    'href',
    'https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app'
  );
  expect(deployNowButton).toHaveAttribute('target', '_blank');
  expect(deployNowButton).toHaveAttribute('rel', 'noopener noreferrer');

  expect(readOurDocsButton).toBeInTheDocument();
  expect(readOurDocsButton).toHaveAttribute(
    'href',
    'https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app'
  );
  expect(readOurDocsButton).toHaveAttribute('target', '_blank');
  expect(readOurDocsButton).toHaveAttribute('rel', 'noopener noreferrer');
});
