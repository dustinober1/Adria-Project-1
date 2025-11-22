import { render, screen } from '@testing-library/react';

import Home from '../page';

describe('Home page', () => {
  it('renders hero copy', () => {
    render(<Home />);

    expect(screen.getByText('Adria Cross')).toBeInTheDocument();
    expect(
      screen.getByText('Professional Personal Stylist')
    ).toBeInTheDocument();
  });
});
