const request = require('supertest');

const app = require('../../src/app');

const MAIN_ROUTE = '/accounts';
let user;

beforeEach(async () => {
  const res = await app.services.user.create({
    name: 'User Account',
    email: `${Date.now()}@email.com`,
    password: '123456',
  });
  user = { ...res[0] };
});

test('to create a new account successfully', () => request(app).post(MAIN_ROUTE)
  .send({ name: 'Acc #1', user_id: user.id })
  .then((result) => {
    expect(result.status).toBe(201);
    expect(result.body.name).toBe('Acc #1');
  }));

test('to disallow an account creation without name property', () => request(app).post(MAIN_ROUTE)
  .send({ user_id: user.id })
  .then((result) => {
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Nome é um atributo obrigatório');
  }));

test.todo('to disallow from creating an account whose name property already exists');

test('to list all accounts', () => app.db('accounts')
  .insert({ name: 'Acc list', user_id: user.id })
  .then(() => request(app).get(MAIN_ROUTE)
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    })));

test.todo('to list only accounts from user');

test('to return an account by ID', () => app.db('accounts')
  .insert({ name: 'Acc by ID', user_id: user.id }, ['id'])
  .then((acc) => request(app).get(`${MAIN_ROUTE}/${acc[0].id}`)
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Acc by ID');
      expect(res.body.user_id).toBe(user.id);
    })));

test.todo('to not return an account from another user');

test('to update an account property', () => app.db('accounts')
  .insert({ name: 'Acc to update', user_id: user.id }, ['id'])
  .then((acc) => request(app).put(`${MAIN_ROUTE}/${acc[0].id}`)
    .send({ name: 'Acc updated' }))
  .then((res) => {
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Acc updated');
  }));

test.todo('to not update an account property from another user');

test('to remove an account', () => app.db('accounts')
  .insert({ name: 'Acc to delete', user_id: user.id }, ['id'])
  .then((acc) => request(app).delete(`${MAIN_ROUTE}/${acc[0].id}`))
  .then((res) => {
    expect(res.status).toBe(204);
  }));

test.todo('to not remove an account from another user');
