const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../../src/app');

const MAIN_ROUTE = '/v1/accounts';
let user;
let user2;

beforeEach(async () => {
  const res = await app.services.user.create({
    name: 'User Account',
    email: `${Date.now()}@email.com`,
    password: '123456',
  });
  user = { ...res[0] };
  user.token = jwt.sign(user, process.env.JWT_SECRET);

  const res2 = await app.services.user.create({
    name: 'User Account #2',
    email: `${Date.now()}@email.com`,
    password: '123456',
  });
  user2 = { ...res2[0] };
});

test('to create a new account successfully', () => request(app).post(MAIN_ROUTE)
  .set('authorization', `Bearer ${user.token}`)
  .send({ name: 'Acc #1' })
  .then((result) => {
    expect(result.status).toBe(201);
    expect(result.body.name).toBe('Acc #1');
  }));

test('to disallow an account creation without name property', () => request(app).post(MAIN_ROUTE)
  .set('authorization', `Bearer ${user.token}`)
  .send()
  .then((result) => {
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Nome é um atributo obrigatório');
  }));

test('to disallow from creating an account whose name property already exists', () => app.db('accounts').insert({ name: 'Acc duplicada', user_id: user.id })
  .then(() => request(app).post(MAIN_ROUTE)
    .set('authorization', `Bearer ${user.token}`)
    .send({ name: 'Acc duplicada' })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Já existe uma conta com esse nome');
    })));

test('to list only accounts from user', () => app.db('accounts').insert([
  { name: 'Acc User #1', user_id: user.id },
  { name: 'Acc User #2', user_id: user2.id },
]).then(() => request(app).get(MAIN_ROUTE)
  .set('authorization', `Bearer ${user.token}`)
  .then((res) => {
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Acc User #1');
  })));

test('to return an account by ID', () => app.db('accounts')
  .insert({ name: 'Acc by ID', user_id: user.id }, ['id'])
  .then((acc) => request(app).get(`${MAIN_ROUTE}/${acc[0].id}`)
    .set('authorization', `Bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Acc by ID');
      expect(res.body.user_id).toBe(user.id);
    })));

test('to not return an account from another user', () => app.db('accounts')
  .insert({ name: 'Acc user #2', user_id: user2.id }, ['id'])
  .then((acc) => request(app).get(`${MAIN_ROUTE}/${acc[0].id}`)
    .set('authorization', `Bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Este recurso não pertence ao usuário');
    })));

test('to update an account property', () => app.db('accounts')
  .insert({ name: 'Acc to update', user_id: user.id }, ['id'])
  .then((acc) => request(app).put(`${MAIN_ROUTE}/${acc[0].id}`)
    .set('authorization', `Bearer ${user.token}`)
    .send({ name: 'Acc updated' }))
  .then((res) => {
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Acc updated');
  }));

test('to not update an account property from another user', () => app.db('accounts')
  .insert({ name: 'Acc user #2', user_id: user2.id }, ['id'])
  .then((acc) => request(app).put(`${MAIN_ROUTE}/${acc[0].id}`)
    .send({ name: 'Acc updated' })
    .set('authorization', `Bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Este recurso não pertence ao usuário');
    })));

test('to remove an account', () => app.db('accounts')
  .insert({ name: 'Acc to delete', user_id: user.id }, ['id'])
  .then((acc) => request(app).delete(`${MAIN_ROUTE}/${acc[0].id}`)
    .set('authorization', `Bearer ${user.token}`))
  .then((res) => {
    expect(res.status).toBe(204);
  }));

test('to not remove an account from another user', () => app.db('accounts')
  .insert({ name: 'Acc user #2', user_id: user2.id }, ['id'])
  .then((acc) => request(app).delete(`${MAIN_ROUTE}/${acc[0].id}`)
    .set('authorization', `Bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Este recurso não pertence ao usuário');
    })));
