import request from 'supertest';

import app from '../../index';
import {
  cleanupTestUsers,
  disconnectPrisma,
  prisma,
} from '../helpers/dbTestHelper';

const createAdminViaRegister = async () => {
  const email = `admin-${Date.now()}@example.com`;
  const response = await request(app).post('/api/v1/auth/register').send({
    email,
    password: 'ValidPass123',
    firstName: 'Admin',
    lastName: 'Forms',
    role: 'super_admin',
  });

  return {
    email,
    id: response.body.user.id as string,
    accessToken: response.body.accessToken as string,
  };
};

const buildTemplatePayload = (name: string) => ({
  name,
  description: 'Test form template for integration tests',
  fields: [
    {
      id: 'goals',
      label: 'Goals',
      type: 'textarea',
      validation: { required: true, minLength: 5 },
    },
    {
      id: 'timeline',
      label: 'Timeline',
      type: 'select',
      options: [
        { label: '2 weeks', value: '2-weeks' },
        { label: '1 month', value: '1-month' },
      ],
      validation: { required: true },
    },
  ],
});

describe('Forms API', () => {
  afterEach(async () => {
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await disconnectPrisma();
  });

  it('allows admin to create and fetch templates', async () => {
    const admin = await createAdminViaRegister();
    const payload = buildTemplatePayload('Test Template One');

    const createRes = await request(app)
      .post('/api/v1/admin/forms/templates')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send(payload);

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.name).toBe('Test Template One');
    expect(createRes.body.data.version).toBe(1);

    const listRes = await request(app)
      .get('/api/v1/admin/forms/templates')
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(listRes.status).toBe(200);
    expect(
      listRes.body.data.some(
        (template: { id: string }) => template.id === createRes.body.data.id
      )
    ).toBe(true);
  });

  it('accepts public submissions and stores responses', async () => {
    const admin = await createAdminViaRegister();
    const payload = buildTemplatePayload('Test Submission Template');

    const templateRes = await request(app)
      .post('/api/v1/admin/forms/templates')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send(payload);

    const templateId = templateRes.body.data.id as string;

    const submitRes = await request(app)
      .post(`/api/v1/forms/${templateId}/submit`)
      .send({
        email: 'submitter@example.com',
        responses: {
          goals: 'I need a new wardrobe for travel.',
          timeline: '2-weeks',
        },
        recaptchaToken: 'integration-test',
      });

    expect(submitRes.status).toBe(201);
    expect(submitRes.body.success).toBe(true);

    const stored = await prisma.formSubmission.findUnique({
      where: { id: submitRes.body.data.id },
    });

    expect(stored?.formTemplateId).toBe(templateId);
    expect(stored?.responses).toMatchObject({
      goals: 'I need a new wardrobe for travel.',
      timeline: '2-weeks',
    });
  });

  it('prevents removing fields after submissions exist and bumps version on change', async () => {
    const admin = await createAdminViaRegister();
    const payload = buildTemplatePayload('Test Versioned Template');

    const templateRes = await request(app)
      .post('/api/v1/admin/forms/templates')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send(payload);
    const templateId = templateRes.body.data.id as string;

    await request(app).post(`/api/v1/forms/${templateId}/submit`).send({
      email: 'versioned@example.com',
      responses: {
        goals: 'Check versioning flow.',
        timeline: '1-month',
      },
      recaptchaToken: 'integration-test',
    });

    const removalAttempt = await request(app)
      .put(`/api/v1/admin/forms/templates/${templateId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        fields: [
          {
            id: 'goals',
            label: 'Goals',
            type: 'textarea',
            validation: { required: true, minLength: 5 },
          },
        ],
      });

    expect(removalAttempt.status).toBe(409);

    const additiveUpdate = await request(app)
      .put(`/api/v1/admin/forms/templates/${templateId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        fields: [
          ...payload.fields,
          {
            id: 'budget',
            label: 'Budget',
            type: 'text',
            validation: { required: false, maxLength: 50 },
          },
        ],
      });

    expect(additiveUpdate.status).toBe(200);
    expect(additiveUpdate.body.data.version).toBe(2);
  });

  it('requires email for guest submissions', async () => {
    const admin = await createAdminViaRegister();
    const payload = buildTemplatePayload('Test Email Required Template');

    const templateRes = await request(app)
      .post('/api/v1/admin/forms/templates')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send(payload);
    const templateId = templateRes.body.data.id as string;

    const res = await request(app).post(`/api/v1/forms/${templateId}/submit`).send({
      responses: {
        goals: 'Missing email should fail',
        timeline: '2-weeks',
      },
      recaptchaToken: 'integration-test',
    });

    expect(res.status).toBe(400);
  });

  it('enforces RBAC on admin submissions', async () => {
    const res = await request(app).get('/api/v1/admin/forms/submissions');
    expect(res.status).toBe(401);
  });
});
