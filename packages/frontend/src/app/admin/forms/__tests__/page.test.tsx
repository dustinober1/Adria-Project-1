import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';

import AdminFormsPage from '../page';

jest.mock('../../../../lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  withAuth: () => ({}),
}));

jest.mock('@adria/shared', () => ({
  FormFieldType: {
    TEXT: 'text',
    TEXTAREA: 'textarea',
    SELECT: 'select',
    RADIO: 'radio',
    CHECKBOX: 'checkbox',
  },
  slugify: (text: string) => text.toLowerCase().replace(/\s+/g, '-'),
}));

const apiClient = require('../../../../lib/api').apiClient as {
  get: jest.Mock;
};

describe('Admin forms page', () => {
  beforeEach(() => {
    apiClient.get.mockReset();
    window.localStorage.setItem('adria_admin_token', 'token');
  });

  it('shows templates list', async () => {
    apiClient.get
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 'template-1',
              name: 'Test Admin Template',
              description: 'desc',
              active: true,
              version: 1,
              fields: [],
              _count: { submissions: 0 },
            },
          ],
        },
      })
      .mockResolvedValueOnce({ data: { data: [] } }); // submissions

    render(
      <QueryClientProvider client={new QueryClient()}>
        <AdminFormsPage />
      </QueryClientProvider>
    );

    await waitFor(() =>
      expect(screen.getByText('Test Admin Template')).toBeInTheDocument()
    );
  });
});
