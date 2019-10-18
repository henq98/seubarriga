const request = require('supertest');

const app = require('../src/app');

test('to answer on root', async () => {
  await request(app).get('/').then((res) => expect(res.status).toBe(200));
});
