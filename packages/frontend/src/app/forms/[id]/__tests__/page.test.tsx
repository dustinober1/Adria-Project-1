import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';

import DynamicFormPage from '../page';

jest.mock('../../../../lib/useRecaptcha', () => ({
  useRecaptcha: () => ({
    ready: true,
    error: null,
    executeRecaptcha: jest.fn().mockResolvedValue('token'),
  }),
}));

jest.mock('@adria/shared', () => ({
  FormFieldType: {
    TEXT: 'text',
    TEXTAREA: 'textarea',
    SELECT: 'select',
    RADIO: 'radio',
    CHECKBOX: 'checkbox',
  },
}));

jest.mock('../../../../lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const apiClient = require('../../../../lib/api').apiClient as {
  get: jest.Mock;
  post: jest.Mock;
};

const template = {
  id: 'form-1',
  name: 'Test Form',
  description: 'A test template',
  version: 1,
  fields: [
    {
      id: 'goals',
      label: 'What are your goals?',
      type: 'textarea',
      validation: { required: true, minLength: 5 },
    },
  ],
};

describe('Dynamic form page', () => {
  it('renders template fields and contact email input', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { data: template } });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <DynamicFormPage params={{ id: 'form-1' }} />
      </QueryClientProvider>
    );

    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());

    expect(await screen.findByText('Contact email')).toBeInTheDocument();
    expect(await screen.findByText('What are your goals?')).toBeInTheDocument();
  });
});
