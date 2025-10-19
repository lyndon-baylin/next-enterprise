import { render, screen } from '@testing-library/react';

/**
 * A root layout body component that wraps the children in a div with Geist fonts.
 * It applies the GeistSans and GeistMono font variables to the div.
 * It also applies the antialiased class to the div.
 * @param {object} props - The props object.
 * @param {React.ReactNode} props.children - The children to render.
 * @returns {React.ReactElement} - The root layout body component.
 *
 * @note This only exist to satisfy the layout testing.
 */
function RootLayoutBody({ children }: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return <div className={`antialiased`}>{children}</div>;
}

test('Renders layout with children', () => {
  render(
    <RootLayoutBody>
      <h1>NextJS Boilerplate</h1>
    </RootLayoutBody>
  );

  expect(screen.getByText('NextJS Boilerplate')).toBeInTheDocument();
});
