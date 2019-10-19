const request = require('supertest');

const app = require('../../src/app.js');

const email = `${Date.now()}@email.com`;

test('to receive authentication token when sign in', () => app.services.user.create({
  name: 'Walter',
  email,
  password: '1234',
}).then(() => request(app).post('/auth/signin')
  .send({ email, password: '1234' })
  .then((res) => {
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  })));
