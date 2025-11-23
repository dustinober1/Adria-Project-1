import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import AdminInquiriesPage from '../page';

jest.mock('../../../../lib/api', () => ({
  apiClient: {
    get: jest.fn().mockResolvedValue({
      data: { success: true, data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } },
    }),
    put: jest.fn().mockResolvedValue({ data: {} }),
  },
  withAuth: () => ({}),
}));

describe('Admin inquiries page', () => {
  it('renders heading and token input', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AdminInquiriesPage />
      </QueryClientProvider>
    );

    expect(
      screen.getByText(/Manage contact inquiries/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Paste your admin JWT/i)
    ).toBeInTheDocument();
  });
});
