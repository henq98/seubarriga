const request = require('supertest');

const app = require('../src/app.js');

test('to create an user via sign up', () => request(app).post('/auth/signup')
  .send({
    name: 'Walter',
    email: `${Date.now()}@email.com`,
    password: '1234',
  }).then((res) => {
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Walter');
    expect(res.body).toHaveProperty('email');
    expect(res.body).not.toHaveProperty('password');
  }));

test('to receive authentication token when sign in', () => {
  const email = `${Date.now()}@email.com`;

  return app.services.user.create({
    name: 'Walter',
    email,
    password: '1234',
  }).then(() => request(app).post('/auth/signin')
    .send({ email, password: '1234' })
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    }));
});

test('to not authenticate an user with wrong email', () => request(app).post('/auth/signin')
  .send({ email: 'inexistent@email.com', password: 'admin' })
  .then((res) => {
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Usuário ou senha inválido');
  }));

test('to not authenticate an user with wrong password', () => {
  const email = `${Date.now()}@email.com`;

  return app.services.user.create({
    name: 'Walter',
    email,
    password: '1234',
  }).then(() => request(app).post('/auth/signin')
    .send({ email, password: '4321' })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Usuário ou senha inválido');
    }));
});
test('to not access a protected route without authentication token', () => request(app).get('/v1/users')
  .then((res) => {
    expect(res.status).toBe(401);
  }));
