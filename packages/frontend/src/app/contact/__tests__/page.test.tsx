import { render, screen } from '@testing-library/react';

import ContactPage from '../page';

jest.mock('../../../lib/useRecaptcha', () => ({
  useRecaptcha: () => ({
    ready: true,
    error: null,
    executeRecaptcha: jest.fn().mockResolvedValue('test-token'),
  }),
}));

jest.mock('../../../lib/api', () => ({
  apiClient: { post: jest.fn() },
}));

describe('Contact page', () => {
  it('renders form fields and CTA', () => {
    render(<ContactPage />);

    expect(
      screen.getByText('Tell us about your styling needs')
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit inquiry/i })).toBeInTheDocument();
  });
});
