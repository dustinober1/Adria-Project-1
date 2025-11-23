import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';

import FormsLandingPage from '../page';

jest.mock('../../../lib/api', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

const apiClient = require('../../../lib/api').apiClient as { get: jest.Mock };

describe('Forms landing page', () => {
  it('lists available templates', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 'template-1',
            name: 'Landing Template',
            description: 'A landing template',
            version: 1,
            fields: [],
          },
        ],
      },
    });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <FormsLandingPage />
      </QueryClientProvider>
    );

    await waitFor(() =>
      expect(screen.getByText('Landing Template')).toBeInTheDocument()
    );
  });
});
