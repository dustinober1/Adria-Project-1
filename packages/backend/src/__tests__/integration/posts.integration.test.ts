import request from 'supertest';

import app from '../../index';
import { cleanupTestUsers, disconnectPrisma } from '../helpers/dbTestHelper';

const adminCredentials = {
  email: `admin-posts-${Date.now()}@example.com`,
  password: 'ValidPass123',
  firstName: 'Admin',
  lastName: 'Posts',
  role: 'admin',
};

const createAdmin = async () => {
  const response = await request(app).post('/api/v1/auth/register').send(adminCredentials);
  return {
    token: response.body.accessToken as string,
  };
};

describe('Posts API', () => {
  afterEach(async () => {
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await disconnectPrisma();
  });

  it('creates a draft and published post, lists published publicly, and gets by slug', async () => {
    const admin = await createAdmin();

    const draft = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        title: 'Draft Test Post',
        excerpt: 'Draft test excerpt',
        content: 'Draft content that is sufficiently long for validation.',
        status: 'draft',
      });
    expect(draft.status).toBe(201);

    const published = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        title: 'Published Test Post',
        excerpt: 'Published test excerpt',
        content: 'Published content that is sufficiently long for validation.',
        status: 'published',
      });
    expect(published.status).toBe(201);

    const listPublic = await request(app).get('/api/v1/posts');
    expect(listPublic.status).toBe(200);
    expect(
      listPublic.body.data.some((p: { title: string }) => p.title === 'Published Test Post')
    ).toBe(true);
    expect(
      listPublic.body.data.some((p: { title: string }) => p.title === 'Draft Test Post')
    ).toBe(false);

    const slug = published.body.data.slug as string;
    const detail = await request(app).get(`/api/v1/posts/${slug}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.title).toBe('Published Test Post');

    const draftDetail = await request(app).get(`/api/v1/posts/${draft.body.data.slug}`);
    expect(draftDetail.status).toBe(404);
  });

  it('updates status to published and sets publishedAt', async () => {
    const admin = await createAdmin();

    const draft = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        title: 'Status Test Draft',
        excerpt: 'Status test excerpt',
        content: 'Content long enough to pass validation for status test.',
        status: 'draft',
      });
    const postId = draft.body.data.id as string;

    const statusRes = await request(app)
      .patch(`/api/v1/posts/${postId}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'published' });

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.status).toBe('PUBLISHED');
    expect(statusRes.body.data.publishedAt).toBeTruthy();
  });

  it('lists posts for admin with all statuses', async () => {
    const admin = await createAdmin();

    await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        title: 'Admin Test Draft',
        excerpt: 'Admin draft test excerpt',
        content: 'Content long enough to pass validation.',
        status: 'draft',
      });

    const adminList = await request(app)
      .get('/api/v1/posts/admin/list')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(adminList.status).toBe(200);
    expect(adminList.body.data.length).toBeGreaterThan(0);
  });

  it('rejects create without auth', async () => {
    const res = await request(app).post('/api/v1/posts').send({
      title: 'No Auth',
      excerpt: 'No auth excerpt',
      content: 'Content long enough to pass validation.',
    });

    expect(res.status).toBe(401);
  });
});
