import request from 'supertest';

import app from '../../index';
import {
  cleanupTestUsers,
  disconnectPrisma,
  prisma,
} from '../helpers/dbTestHelper';

describe('Contact submission API', () => {
  afterEach(async () => {
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await disconnectPrisma();
  });

  it('creates a contact inquiry and returns sanitized response', async () => {
    const res = await request(app).post('/api/v1/contact/submit').send({
      fullName: 'Test Contact',
      email: 'contact-test@example.com',
      phone: '555-9999',
      message: 'I would like to learn more about wardrobe overhaul services.',
      serviceInterest: 'Wardrobe Overhaul',
      recaptchaToken: 'test-token',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.notifications).toEqual({
      visitor: false,
      admin: false,
    });

    const stored = await prisma.contactInquiry.findUnique({
      where: { id: res.body.data.id },
    });

    expect(stored?.email).toBe('contact-test@example.com');
    expect(stored?.status).toBe('NEW');
  });

  it('rejects invalid payload', async () => {
    const res = await request(app).post('/api/v1/contact/submit').send({
      fullName: '',
      email: 'not-an-email',
      message: 'short',
      recaptchaToken: 'token',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('blocks duplicate submissions within the dedupe window', async () => {
    const payload = {
      fullName: 'Duplicate User',
      email: 'dup@example.com',
      message: 'Same message to trigger dedupe.',
      serviceInterest: 'Closet Edit',
      recaptchaToken: 'duplicate-token',
    };

    const first = await request(app)
      .post('/api/v1/contact/submit')
      .send(payload);
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/v1/contact/submit')
      .send(payload);
    expect(second.status).toBe(429);
  });
});
