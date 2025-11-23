import { InquiryStatus } from '@prisma/client';
import request from 'supertest';

import app from '../../index';
import {
  cleanupTestUsers,
  disconnectPrisma,
  prisma,
} from '../helpers/dbTestHelper';

const adminCredentials = {
  email: `admin-inquiries-${Date.now()}@example.com`,
  password: 'ValidPass123',
  firstName: 'Admin',
  lastName: 'Inquiries',
  role: 'admin',
};

const clientCredentials = {
  email: `client-inquiries-${Date.now()}@example.com`,
  password: 'ValidPass123',
  firstName: 'Client',
  lastName: 'Inquiries',
};

const createAdmin = async () => {
  const response = await request(app).post('/api/v1/auth/register').send(adminCredentials);
  return {
    token: response.body.accessToken as string,
  };
};

const createClient = async () => {
  const response = await request(app).post('/api/v1/auth/register').send(clientCredentials);
  return {
    token: response.body.accessToken as string,
  };
};

describe('Admin inquiries API', () => {
  afterEach(async () => {
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await disconnectPrisma();
  });

  it('lists inquiries with filters and pagination', async () => {
    const admin = await createAdmin();

    await prisma.contactInquiry.createMany({
      data: [
        {
          fullName: 'Filter User One',
          email: 'filter-one@example.com',
          message: 'Testing filter',
          status: InquiryStatus.NEW,
        },
        {
          fullName: 'Filter User Two',
          email: 'filter-two@example.com',
          message: 'Testing filter two',
          status: InquiryStatus.RESPONDED,
          respondedAt: new Date(),
        },
      ],
    });

    const res = await request(app)
      .get('/api/v1/admin/inquiries?status=responded')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.every((i: { status: string }) => i.status === 'RESPONDED')).toBe(true);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it('gets inquiry detail and handles 404', async () => {
    const admin = await createAdmin();
    const created = await prisma.contactInquiry.create({
      data: {
        fullName: 'Detail User',
        email: 'detail@example.com',
        message: 'Need detail',
        status: InquiryStatus.NEW,
      },
    });

    const detail = await request(app)
      .get(`/api/v1/admin/inquiries/${created.id}`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.id).toBe(created.id);

    const missing = await request(app)
      .get('/api/v1/admin/inquiries/non-existent')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(missing.status).toBe(404);
  });

  it('updates inquiry status with valid transitions and blocks invalid ones', async () => {
    const admin = await createAdmin();
    const inquiry = await prisma.contactInquiry.create({
      data: {
        fullName: 'Transition User',
        email: 'transition@example.com',
        message: 'Testing transitions',
        status: InquiryStatus.NEW,
      },
    });

    const toInProgress = await request(app)
      .put(`/api/v1/admin/inquiries/${inquiry.id}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'in_progress' });
    expect(toInProgress.status).toBe(200);
    expect(toInProgress.body.data.status).toBe('IN_PROGRESS');

    const toResponded = await request(app)
      .put(`/api/v1/admin/inquiries/${inquiry.id}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'responded', adminNotes: 'Replied' });
    expect(toResponded.status).toBe(200);
    expect(toResponded.body.data.status).toBe('RESPONDED');
    expect(toResponded.body.data.adminNotes).toBe('Replied');

    const invalid = await request(app)
      .put(`/api/v1/admin/inquiries/${inquiry.id}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'new' });
    expect(invalid.status).toBe(409);
  });

  it('blocks non-admin users', async () => {
    const client = await createClient();

    const res = await request(app)
      .get('/api/v1/admin/inquiries')
      .set('Authorization', `Bearer ${client.token}`);

    expect(res.status).toBe(403);
  });
});
